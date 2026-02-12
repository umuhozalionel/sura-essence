"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

// Helper to update map view when props change
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapWidget({ 
  center = [-1.9441, 30.0619], 
  zoom = 13,
  markers = [] 
}: { 
  center?: [number, number]; 
  zoom?: number; 
  markers?: Array<{ pos: [number, number]; label: string }>;
}) {
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden bg-gray-100 z-0 relative isolate">
      <MapContainer 
        // @ts-ignore
        center={center} 
        // @ts-ignore
        zoom={zoom} 
        scrollWheelZoom={false} 
        className="h-full w-full outline-none"
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />
        
        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.pos}>
            <Popup className="font-sans font-medium">{marker.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}