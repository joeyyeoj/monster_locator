"use client";

import { useState } from "react";
import type { LocationRecord } from "@/lib/types";

type Props = {
  location: LocationRecord;
  onVoted: (location: LocationRecord) => void;
};

function voteFeedbackClass(text: string): string {
  if (text === "Stem opslaan...") {
    return "ios-vote-feedback ios-vote-feedback--pending";
  }
  if (text.includes("kon niet") || text.includes("niet opgeslagen")) {
    return "ios-vote-feedback ios-vote-feedback--err";
  }
  if (text.includes("opgeslagen")) {
    return "ios-vote-feedback ios-vote-feedback--ok";
  }
  return "ios-vote-feedback";
}

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
    <div className="ios-vote-row">
      <div className="ios-vote-btns">
        <button type="button" onClick={() => vote("confirm")} className="ios-btn ios-btn--vote-yes">
          Klopt
        </button>
        <button type="button" onClick={() => vote("deny")} className="ios-btn ios-btn--vote-no">
          Klopt niet
        </button>
      </div>
      <p className="ios-vote-stats-line" style={{ margin: 0 }}>
        <span className="ios-vote-stat-yes">Bevestigd: {location.confirmCount}</span>
        <span className="ios-vote-sep" aria-hidden>
          {" "}
          ·{" "}
        </span>
        <span className="ios-vote-stat-no">Afgekeurd: {location.denyCount}</span>
        <span className="ios-vote-sep" aria-hidden>
          {" "}
          ·{" "}
        </span>
        <span className="ios-vote-stat-trust">Vertrouwen: {location.trustScore}</span>
      </p>
      {status ? <p className={voteFeedbackClass(status)} style={{ margin: 0 }}>{status}</p> : null}
    </div>
  );
}
