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
    <div className="ios-pill-chips ios-pill-chips--nav">
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
          className="ios-chiplink"
        >
          {app.label}
        </a>
      ))}
    </div>
  );
}
