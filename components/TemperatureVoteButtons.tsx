"use client";

import { useState } from "react";
import { emptyTemperatureVoteCounts, type LocationRecord } from "@/lib/types";

type Props = {
  location: LocationRecord;
  onVoted: (location: LocationRecord) => void;
};

export default function TemperatureVoteButtons({ location, onVoted }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const tc = location.temperatureVoteCounts ?? emptyTemperatureVoteCounts;

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
      <div className="ios-temp-btns">
        <button type="button" onClick={() => vote("cold")} className="ios-btn ios-btn--temp-cold">
          Koud
        </button>
        <button type="button" onClick={() => vote("shelf")} className="ios-btn ios-btn--temp-shelf">
          Kamertemperatuur
        </button>
        <button type="button" onClick={() => vote("both")} className="ios-btn ios-btn--temp-both">
          Beide
        </button>
      </div>
      <p className="ios-text-caption-2" style={{ margin: 0, marginTop: "0.35rem" }}>
        Koud: {tc.cold} · Kamertemperatuur: {tc.shelf} · Beide: {tc.both}
      </p>
      {status ? <p className="ios-status-ok" style={{ margin: 0 }}>{status}</p> : null}
    </div>
  );
}
