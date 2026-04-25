"use client";

import { useState } from "react";
import type { LocationRecord } from "@/lib/types";

type Props = {
  location: LocationRecord;
  onVoted: (location: LocationRecord) => void;
};

export default function VoteButtons({ location, onVoted }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  async function vote(voteType: "confirm" | "deny"): Promise<void> {
    setStatus("Stem opslaan...");
    const response = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: location.id, voteType })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(data?.error ?? "Stem kon niet worden opgeslagen.");
      return;
    }

    const data = (await response.json()) as { location: LocationRecord };
    onVoted(data.location);
    setStatus("Stem opgeslagen.");
  }

  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => vote("confirm")}
          style={{
            border: "1px solid #8edb79",
            borderRadius: 10,
            padding: "0.5rem 0.7rem",
            background: "#edf9e8",
            color: "#17461a"
          }}
        >
          Klopt
        </button>
        <button
          type="button"
          onClick={() => vote("deny")}
          style={{
            border: "1px solid #c9d3cd",
            borderRadius: 10,
            padding: "0.5rem 0.7rem",
            background: "#f6f8f7",
            color: "#2e3a33"
          }}
        >
          Klopt niet
        </button>
      </div>
      <small style={{ color: "#5a675f" }}>
        Bevestigd: {location.confirmCount} | Afgekeurd: {location.denyCount} | Vertrouwen: {location.trustScore}
      </small>
      {status ? <small style={{ color: "#4f9a3e" }}>{status}</small> : null}
    </div>
  );
}
