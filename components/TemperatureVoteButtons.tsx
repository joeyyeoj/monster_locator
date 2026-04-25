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
  both: "Both",
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
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <small style={{ color: "#5a675f" }}>Temperatuur stemmen</small>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => vote("cold")}
          style={{
            border: "1px solid #8edb79",
            borderRadius: 10,
            padding: "0.45rem 0.65rem",
            background: "#edf9e8",
            color: "#17461a"
          }}
        >
          Koud
        </button>
        <button
          type="button"
          onClick={() => vote("shelf")}
          style={{
            border: "1px solid #8edb79",
            borderRadius: 10,
            padding: "0.45rem 0.65rem",
            background: "#edf9e8",
            color: "#17461a"
          }}
        >
          Kamertemperatuur
        </button>
        <button
          type="button"
          onClick={() => vote("both")}
          style={{
            border: "1px solid #8edb79",
            borderRadius: 10,
            padding: "0.45rem 0.65rem",
            background: "#edf9e8",
            color: "#17461a"
          }}
        >
          Both
        </button>
      </div>
      <small style={{ color: "#5a675f" }}>Huidige temperatuur: {labels[location.availabilityType]}</small>
      {status ? <small style={{ color: "#4f9a3e" }}>{status}</small> : null}
    </div>
  );
}
