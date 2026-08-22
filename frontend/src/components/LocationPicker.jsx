import { useEffect, useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

async function reverseGeocode(latitude, longitude) {
  if (!GEOAPIFY_KEY) {
    return 'موقعي الحالي';
  }

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=ar&apiKey=${GEOAPIFY_KEY}`
  );
  const data = await response.json();
  return data.features?.[0]?.properties?.formatted || 'موقعي الحالي';
}

function ChangeView({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 13));
  }, [center, map]);

  return null;
}

function LocationMarker({ position, onLocationChange }) {
  useMapEvents({
    click: async (event) => {
      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;

      try {
        const name = await reverseGeocode(latitude, longitude);
        onLocationChange({ name, latitude, longitude });
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        onLocationChange({
          name: 'الموقع المحدد على الخريطة',
          latitude,
          longitude,
        });
      }
    },
  });

  return <Marker position={position} />;
}

export default function LocationPicker({ position, onLocationChange }) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const name = await reverseGeocode(
            coords.latitude,
            coords.longitude
          );

          onLocationChange({
            name,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        } catch (error) {
          console.error('GPS reverse geocoding error:', error);
          onLocationChange({
            name: 'موقعي الحالي',
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        setLocationError(
          error.code === 1
            ? 'اسمح بالوصول إلى موقعك من إعدادات المتصفح'
            : 'تعذر تحديد موقعك الحالي'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="location-picker-shell" dir="rtl">
      <div className="location-picker-toolbar">
        <div>
          <strong>حدد موقع الاستلام</strong>
          <span>انقر على الخريطة أو استخدم موقعك الحالي</span>
        </div>

        <button
          type="button"
          className="gps-location-button"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <LocateFixed size={16} />
          )}
          {locating ? 'جاري التحديد...' : 'استخدم موقعي'}
        </button>
      </div>

      <MapContainer
        center={position}
        zoom={12}
        scrollWheelZoom
        className="location-map"
      >
        <ChangeView center={position} />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          onLocationChange={onLocationChange}
        />
      </MapContainer>

      {locationError && (
        <p className="location-picker-error" role="alert">
          {locationError}
        </p>
      )}
    </div>
  );
}
