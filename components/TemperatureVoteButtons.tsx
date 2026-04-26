"use client";

import { useState } from "react";
import type { DisplayAvailabilityType, LocationRecord } from "@/lib/types";

type Props = {
  location: LocationRecord;
  onVoted: (location: LocationRecord) => void;
};

const labels: Record<DisplayAvailabilityType, string> = {
  cold: "Koud",
  shelf: "Kamertemperatuur",
  both: "Beide",
  unknown: "Onbekend"
};

export default function TemperatureVoteButtons({ location, onVoted }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  async function vote(availabilityType: "cold" | "shelf" | "both"): Promise<void> {
    setStatus("Temperatuurstem opslaan...");
    const response = await fetch("/api/temperature-votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: location.id, availabilityType })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(data?.error ?? "Temperatuurstem kon niet worden opgeslagen.");
      return;
    }

    const data = (await response.json()) as { location: LocationRecord };
    onVoted(data.location);
    setStatus("Temperatuurstem opgeslagen.");
  }

  return (
    <div className="ios-temp-row">
      <p className="ios-text-footnote" style={{ margin: 0 }}>
        Temperatuur stemmen
      </p>
      <div className="ios-temp-btns">
        <button type="button" onClick={() => vote("cold")} className="ios-btn ios-btn--tint-ghost">
          Koud
        </button>
        <button type="button" onClick={() => vote("shelf")} className="ios-btn ios-btn--tint-ghost">
          Kamertemperatuur
        </button>
        <button type="button" onClick={() => vote("both")} className="ios-btn ios-btn--tint-ghost">
          Beide
        </button>
      </div>
      <p className="ios-text-caption-2" style={{ margin: 0 }}>
        Huidige temperatuur: {labels[location.availabilityType]}
      </p>
      {status ? <p className="ios-status-ok" style={{ margin: 0 }}>{status}</p> : null}
    </div>
  );
}
