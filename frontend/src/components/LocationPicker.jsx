import { useEffect, useState } from 'react';
import { LocateFixed, Loader2, MapPin, X, Check } from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

console.log('GEOAPIFY KEY:', GEOAPIFY_KEY);

const DEFAULT_POSITION = [15.3694, 44.1910]; // صنعاء

const TILE_URL = GEOAPIFY_KEY
  ? `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/* =========================================================
   تحويل أي صيغة محتملة للموقع إلى:
   {
      name,
      latitude,
      longitude
   }
========================================================= */

function normalizeLocation(location) {
  if (!location) {
    return null;
  }

  // إذا كان الموقع مصفوفة [lat, lng]
  if (Array.isArray(location)) {
    const latitude = Number(location[0]);
    const longitude = Number(location[1]);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return {
        name: 'الموقع المحدد على الخريطة',
        latitude,
        longitude,
      };
    }

    return null;
  }

  // إذا كان الموقع كائنًا
  if (typeof location === 'object') {
    const latitude = Number(
      location.latitude ??
      location.lat ??
      location.latitud ??
      location.coordinates?.[1]
    );

    const longitude = Number(
      location.longitude ??
      location.lng ??
      location.lon ??
      location.long ??
      location.coordinates?.[0]
    );

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return {
        name:
          location.name ||
          location.address ||
          location.formatted ||
          'الموقع المحدد على الخريطة',
        latitude,
        longitude,
      };
    }
  }

  return null;
}

/* =========================================================
   Reverse Geocoding
========================================================= */

async function reverseGeocode(latitude, longitude) {
  if (!GEOAPIFY_KEY) {
    return 'الموقع المحدد على الخريطة';
  }

  const url = new URL(
    'https://api.geoapify.com/v1/geocode/reverse'
  );

  url.searchParams.set('lat', latitude);
  url.searchParams.set('lon', longitude);
  url.searchParams.set('lang', 'ar');
  url.searchParams.set('apiKey', GEOAPIFY_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `Reverse geocoding failed: ${response.status}`
    );
  }

  const data = await response.json();

const properties = data.features?.[0]?.properties || {};

return {
  name:
    properties.formatted ||
    'الموقع المحدد على الخريطة',

  city:
    properties.city ||
    properties.municipality ||
    properties.county ||
    properties.state ||
    '',

  latitude,
 longitude,
};
}
/* =========================================================
   تغيير مركز الخريطة
========================================================= */

function ChangeView({ center }) {
  const map = useMap();

  useEffect(() => {
    if (
      !Array.isArray(center) ||
      center.length !== 2 ||
      !Number.isFinite(Number(center[0])) ||
      !Number.isFinite(Number(center[1]))
    ) {
      return;
    }

    const timer = setTimeout(() => {
      map.invalidateSize();

      map.setView(
        [
          Number(center[0]),
          Number(center[1]),
        ],
        Math.max(map.getZoom(), 13),
        {
          animate: true,
        }
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [center, map]);

  return null;
}

/* =========================================================
   Marker + الضغط على الخريطة
========================================================= */

function LocationMarker({
  position,
  onLocationChange,
}) {
  useMapEvents({
    click: async (event) => {
      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;

      // إظهار الموقع مباشرة
      onLocationChange({
        name: 'جاري تحديد العنوان...',
        latitude,
        longitude,
      });

      try {
        const location = await reverseGeocode(
          latitude,
          longitude
        );
      
        onLocationChange(location);
      }catch (error) {
        console.error(
          'Reverse geocoding error:',
          error
        );

        onLocationChange({
          name: 'الموقع المحدد على الخريطة',
          latitude,
          longitude,
        });
      }
    },
  });

  // حماية من undefined
  if (
    !Array.isArray(position) ||
    position.length !== 2
  ) {
    return null;
  }

  const latitude = Number(position[0]);
  const longitude = Number(position[1]);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return (
    <Marker
      position={[
        latitude,
        longitude,
      ]}
    />
  );
}

/* =========================================================
   LocationPicker
========================================================= */

export default function LocationPicker({
  position,
  onLocationChange,
  mode = 'pickup',
}) {
  const [showMap, setShowMap] = useState(false);

  const [locating, setLocating] =
    useState(false);

  const [locationError, setLocationError] =
    useState('');

  const [selectedLocation, setSelectedLocation] =
    useState(() => normalizeLocation(position));
    const isShowroom = mode === 'showroom';

const pickerTitle = isShowroom
  ? 'موقع المعرض'
  : 'موقع الاستلام';

const pickerButtonText = isShowroom
  ? 'اختيار موقع المعرض'
  : 'اختيار موقع الاستلام';

  /* =====================================================
     تحديث الموقع عند تغييره من الصفحة الرئيسية
  ===================================================== */

  useEffect(() => {
    const normalized =
      normalizeLocation(position);

    if (normalized) {
      setSelectedLocation(normalized);
    }
  }, [position]);

  /* =====================================================
     فتح الخريطة
  ===================================================== */

  const openMap = () => {
    setLocationError('');

    const normalized =
      normalizeLocation(position);

    setSelectedLocation(
      normalized || selectedLocation || null
    );

    setShowMap(true);
  };


  /* =====================================================
     إغلاق الخريطة
  ===================================================== */

  const closeMap = () => {
    setShowMap(false);
    setLocationError('');
  };

  /* =====================================================
     اختيار موقع من الخريطة
  ===================================================== */

  const handleMapLocationChange = (
    location
  ) => {
    setSelectedLocation(location);
    setLocationError('');
  };

  /* =====================================================
     استخدام الموقع الحالي GPS
  ===================================================== */

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        'المتصفح لا يدعم تحديد الموقع'
      );
  
      return;
    }
  
    setLocating(true);
    setLocationError('');
  
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latitude = coords.latitude;
        const longitude = coords.longitude;
  
        try {
          const location = await reverseGeocode(
            latitude,
            longitude
          );
  
          setSelectedLocation(location);
        } catch (error) {
          console.error(
            'GPS reverse geocoding error:',
            error
          );
  
          setSelectedLocation({
            name: 'موقعي الحالي',
            city: '',
            latitude,
            longitude,
          });
        } finally {
          setLocating(false);
        }
      },
  
      (error) => {
        setLocating(false);
  
        if (error.code === 1) {
          setLocationError(
            'اسمح بالوصول إلى موقعك من إعدادات المتصفح'
          );
        } else if (error.code === 2) {
          setLocationError(
            'تعذر تحديد موقعك الحالي'
          );
        } else if (error.code === 3) {
          setLocationError(
            'انتهت مهلة تحديد الموقع'
          );
        } else {
          setLocationError(
            'تعذر تحديد موقعك الحالي'
          );
        }
      },
  
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  /* =====================================================
     تأكيد الموقع
  ===================================================== */

  const confirmLocation = () => {
    if (!selectedLocation) {
      setLocationError(
        'يرجى تحديد موقع على الخريطة أولاً'
      );

      return;
    }

    const latitude =
      Number(selectedLocation.latitude);

    const longitude =
      Number(selectedLocation.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setLocationError(
        'إحداثيات الموقع غير صحيحة'
      );

      return;
    }

    const finalLocation = {
      name:
        selectedLocation.name ||
        'الموقع المحدد على الخريطة',
    
      city:
        selectedLocation.city || '',
    
      latitude,
      longitude,
    };
    // إرسال الموقع للصفحة الرئيسية
    onLocationChange(finalLocation);

    // إغلاق النافذة
    setShowMap(false);
  };

  /* =====================================================
     تجهيز مركز الخريطة
  ===================================================== */

  const normalizedSelected =
    normalizeLocation(selectedLocation);

  const mapCenter = normalizedSelected
    ? [
        Number(
          normalizedSelected.latitude
        ),
        Number(
          normalizedSelected.longitude
        ),
      ]
    : DEFAULT_POSITION;

  /* =====================================================
     JSX
  ===================================================== */

  return (
    <div
      className="location-picker-shell"
      dir="rtl"
    >

      {/* ================================================
          الموقع الحالي
      ================================================= */}

      <div className="selected-location-box">

        <div className="selected-location-info">

          <div className="location-icon">
            <MapPin size={22} />
          </div>

          <div>
            <strong>
              {position
                ? normalizeLocation(position)
                    ?.name ||
                  'تم تحديد الموقع'
                : 'لم يتم تحديد الموقع'}
            </strong>

            {normalizeLocation(position) && (
              <small>
                {Number(
                  normalizeLocation(position)
                    .latitude
                ).toFixed(6)}

                {' , '}

                {Number(
                  normalizeLocation(position)
                    .longitude
                ).toFixed(6)}
              </small>
            )}
          </div>

        </div>

        <button
          type="button"
          className="choose-map-button"
          onClick={openMap}
        >
          <MapPin size={18} />

          {pickerButtonText}      
            </button>

      </div>

      {/* ================================================
          Modal
      ================================================= */}

      {showMap && (
        <div
          className="location-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeMap();
            }
          }}
        >

          <div className="location-modal">

            {/* رأس النافذة */}

            <div className="location-modal-header">

           <div>
              <strong>
    {pickerTitle}
          </strong>

        <span>
    اضغط على الخريطة لتحديد الموقع
       </span>
</div>

<button
  type="button"
  className="location-modal-close"
  onClick={closeMap}
>
  <X size={22} />
</button>

</div>

            {/* ==========================================
                الخريطة
            =========================================== */}

            <div className="location-modal-map">

              <MapContainer
                center={mapCenter}
                zoom={13}
                minZoom={3}
                maxZoom={20}
                scrollWheelZoom={true}
                className="location-map"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >

                <ChangeView
                  center={mapCenter}
                />

                <TileLayer
                  attribution={
                    GEOAPIFY_KEY
                      ? 'Powered by Geoapify | © OpenStreetMap contributors'
                      : '&copy; OpenStreetMap contributors'
                  }
                  url={TILE_URL}
                  maxZoom={20}
                  tileSize={256}
                  detectRetina
                />

                <LocationMarker
                  position={
                    normalizedSelected
                      ? [
                          Number(
                            normalizedSelected.latitude
                          ),
                          Number(
                            normalizedSelected.longitude
                          ),
                        ]
                      : null
                  }
                  onLocationChange={
                    handleMapLocationChange
                  }
                />

              </MapContainer>

              {/* GPS */}

              <button
                type="button"
                className="map-gps-button"
                onClick={
                  useCurrentLocation
                }
                disabled={locating}
              >
                {locating ? (
                  <Loader2
                    size={19}
                    className="spin"
                  />
                ) : (
                  <LocateFixed size={19} />
                )}

                {locating
                  ? 'جاري تحديد الموقع...'
                  : 'موقعي الحالي'}
              </button>

            </div>

            {/* ==========================================
                الخطأ
            =========================================== */}

            {locationError && (
              <div
                className="location-picker-error"
                role="alert"
              >
                {locationError}
              </div>
            )}

            {/* ==========================================
                معلومات الموقع
            =========================================== */}

            <div className="location-modal-footer">

              <div className="location-preview">

                <MapPin size={19} />

                <div>

                  <strong>
                    {normalizedSelected?.name ||
                      'لم يتم تحديد موقع'}
                  </strong>

                  {normalizedSelected && (
                    <small>
                      الإحداثيات:{' '}

                      {Number(
                        normalizedSelected.latitude
                      ).toFixed(6)}

                      {' , '}

                      {Number(
                        normalizedSelected.longitude
                      ).toFixed(6)}
                    </small>
                  )}

                </div>

              </div>

              {/* الأزرار */}

              <div className="location-modal-actions">

                <button
                  type="button"
                  className="cancel-location-button"
                  onClick={closeMap}
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  className="confirm-location-button"
                  onClick={confirmLocation}
                  disabled={
                    !normalizedSelected
                  }
                >
                  <Check size={18} />

                  تأكيد الموقع
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
  
}
