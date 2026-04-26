"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NearbyLocation } from "@/lib/types";

type MapViewProps = {
  center: { lat: number; lng: number };
  locations: NearbyLocation[];
  onSelect: (location: NearbyLocation) => void;
  height?: string | number;
};

const iconByAvailability = {
  cold: divIcon({
    className: "custom-marker",
    html: '<span style="font-size: 1.3rem;">🧊</span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }),
  shelf: divIcon({
    className: "custom-marker",
    html: '<span style="font-size: 1.3rem;">🥤</span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }),
  both: divIcon({
    className: "custom-marker",
    html: '<span style="font-size: 1.1rem;">🧊🥤</span>',
    iconSize: [28, 24],
    iconAnchor: [14, 12]
  }),
  unknown: divIcon({
    className: "custom-marker",
    html: '<span style="font-size: 1.3rem;">❔</span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
};

const userIcon = divIcon({
  className: "user-marker",
  html: '<span style="font-size: 1.3rem;">📍</span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function MapView({ center, locations, onSelect, height = "100dvh" }: MapViewProps) {
  return (
    <div className="ios-map-chrome" style={{ width: "100%" }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height, width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[center.lat, center.lng]} icon={userIcon}>
          <Popup>Jouw locatie</Popup>
        </Marker>

        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={iconByAvailability[location.availabilityType]}
            eventHandlers={{
              click: () => onSelect(location)
            }}
          >
            <Popup>
              <strong>{location.name}</strong>
              <br />
              {location.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
