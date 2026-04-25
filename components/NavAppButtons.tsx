"use client";

import type { LocationRecord } from "@/lib/types";
import { buildNavigationUrl } from "@/lib/services/navigationService";

type Props = {
  location: LocationRecord;
};

const appButtons: { id: "google" | "waze" | "flitsmeister" | "apple"; label: string }[] = [
  { id: "google", label: "Google Maps" },
  { id: "waze", label: "Waze" },
  { id: "flitsmeister", label: "Flitsmeister" },
  { id: "apple", label: "Apple Maps" }
];

export default function NavAppButtons({ location }: Props) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {appButtons.map((app) => (
        <a
          key={app.id}
          href={buildNavigationUrl(app.id, {
            lat: location.lat,
            lng: location.lng,
            name: location.name
          })}
          target="_blank"
          rel="noreferrer"
          style={{
            border: "1px solid #b7c7bd",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.96)",
            padding: "0.45rem 0.7rem",
            textDecoration: "none",
            fontSize: "0.9rem",
            color: "#0d1110",
            boxShadow: "0 4px 10px rgba(10, 24, 12, 0.08)"
          }}
        >
          {app.label}
        </a>
      ))}
    </div>
  );
}
