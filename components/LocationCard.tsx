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
      className="ios-loccard"
    >
      <div className="ios-locrow">
        <strong className="ios-text-body" style={{ fontSize: "0.95rem" }}>
          {location.name}
        </strong>
        <span className="ios-mono-slab" style={{ fontSize: "0.875rem" }}>
          {location.distanceKm.toFixed(2)} km
        </span>
      </div>
      <div className="ios-loccard-address">{location.address}</div>
      <div className="ios-loccard-meta">
        {availabilityLabel(location.availabilityType)} · {trustLabel(location.trustScore)} (
        {location.confirmCount}/{location.denyCount})
      </div>
    </button>
  );
}
