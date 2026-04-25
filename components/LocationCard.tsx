"use client";

import type { NearbyLocation } from "@/lib/types";

type Props = {
  location: NearbyLocation;
  onSelect: (location: NearbyLocation) => void;
};

function availabilityLabel(value: NearbyLocation["availabilityType"]): string {
  if (value === "cold") {
    return "Koud beschikbaar";
  }
  if (value === "shelf") {
    return "Waarschijnlijk kamertemperatuur";
  }
  if (value === "both") {
    return "Koud en kamertemperatuur";
  }
  return "Temperatuur onbekend";
}

function trustLabel(score: number): string {
  if (score >= 3) {
    return "Bevestigd";
  }
  if (score < 0) {
    return "Betwist";
  }
  return "Nieuw";
}

export default function LocationCard({ location, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(location)}
      style={{
        width: "100%",
        textAlign: "left",
        border: "1px solid #d4ddd7",
        borderRadius: 12,
        background: "rgba(255, 255, 255, 0.98)",
        padding: "0.9rem",
        cursor: "pointer",
        color: "#111512",
        boxShadow: "0 4px 10px rgba(10, 24, 12, 0.06)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <strong>{location.name}</strong>
        <span>{location.distanceKm.toFixed(2)} km</span>
      </div>
      <div style={{ fontSize: "0.9rem", marginTop: "0.3rem", color: "#5a675f" }}>{location.address}</div>
      <div style={{ fontSize: "0.85rem", marginTop: "0.4rem", color: "#4f9a3e" }}>
        {availabilityLabel(location.availabilityType)} | {trustLabel(location.trustScore)} ({location.confirmCount}/
        {location.denyCount})
      </div>
    </button>
  );
}
