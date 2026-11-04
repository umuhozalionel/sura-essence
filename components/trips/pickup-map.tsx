"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const KIGALI: [number, number] = [-1.9441, 30.0619];

/** Tap anywhere on the map to pick that spot, and follow a spot picked by search or location. */
function Behaviour({ position, onPick }: { position: [number, number] | null; onPick: (coords: [number, number]) => void }) {
  const map = useMap();
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 15));
  }, [map, position]);
  return null;
}

/** The pickup map on the trip builder: tap the map, or drag the pin, to set the exact spot. */
export default function PickupMap({ position, onPick }: { position: [number, number] | null; onPick: (coords: [number, number]) => void }) {
  return (
    <MapContainer center={position ?? KIGALI} zoom={13} style={{ height: "100%", width: "100%", zIndex: 1 }}>
      {/* OpenStreetMap standard tiles: free, no API key. Keep the attribution (required by the OSM tile usage policy). */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {position && (
        <Marker
          position={position}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onPick([p.lat, p.lng]);
            },
          }}
        />
      )}
      <Behaviour position={position} onPick={onPick} />
    </MapContainer>
  );
}
