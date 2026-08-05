import { useMap } from "react-leaflet";
import { useEffect } from "react";

import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function LocationMarker({ position, onLocationChange }) {
    const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
    useMapEvents({
      async click(e) {
    
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
    
        try {
    
          const res = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${API_KEY}`
          );
    
          const data = await res.json();
    
          onLocationChange({
            latitude: lat,
            longitude: lng,
            name: data.features[0].properties.formatted
          });
    
        } catch (err) {
    
          console.error(err);
    
        }
    
      }
    });

    return <Marker position={position} />;
}
function ChangeView({ center }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, 13);
    }, [center]);

    return null;
}
export default function LocationPicker({
    position,
    onLocationChange,
  }) {


    return (

        <MapContainer
            center={position}
            zoom={12}
            style={{
                height: "250px",
                width: "80%",
                borderRadius: "20px"
            }}
        >
<ChangeView center={position} />
<TileLayer
    attribution='&copy; OpenStreetMap contributors'
    url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
/>
<LocationMarker
  position={position}
  onLocationChange={onLocationChange}
/>

        </MapContainer>

    );

}
