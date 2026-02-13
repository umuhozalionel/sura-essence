"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapWidgetProps {
  pickupCoords?: [number, number] | null;
  dropoffCoords?: [number, number] | null;
  routeCoords?: [number, number][];
}

function MapUpdater({ pickup, dropoff }: { pickup: [number, number] | null; dropoff: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds([pickup, dropoff]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup) {
      map.flyTo(pickup, 13);
    }
  }, [pickup, dropoff, map]);
  return null;
}

export default function MapWidget({ pickupCoords, dropoffCoords, routeCoords }: MapWidgetProps) {
  return (
    <MapContainer center={[-1.9441, 30.0619]} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {pickupCoords && <Marker position={pickupCoords} icon={icon}><Popup>Pickup</Popup></Marker>}
      {dropoffCoords && <Marker position={dropoffCoords} icon={icon}><Popup>Destination</Popup></Marker>}
      
      {routeCoords && routeCoords.length > 0 && (
        <Polyline positions={routeCoords} color="#111827" weight={4} opacity={0.8} />
      )}

      {/* FIX: The || null ensures we never pass 'undefined' */}
      <MapUpdater pickup={pickupCoords || null} dropoff={dropoffCoords || null} />
    </MapContainer>
  );
}