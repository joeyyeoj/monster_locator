"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NavAppButtons from "@/components/NavAppButtons";
import TemperatureVoteButtons from "@/components/TemperatureVoteButtons";
import VoteButtons from "@/components/VoteButtons";
import type { LocationRecord } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

function availabilityText(value: LocationRecord["availabilityType"]): string {
  if (value === "cold") {
    return "Koude beschikbaarheid bevestigd";
  }
  if (value === "shelf") {
    return "Meestal op kamertemperatuur verkocht";
  }
  if (value === "both") {
    return "Verkocht als koud en op kamertemperatuur";
  }
  return "Temperatuur niet bevestigd";
}

export default function LocationDetailPage({ params }: Props) {
  const [locationId, setLocationId] = useState<string>("");
  const [location, setLocation] = useState<LocationRecord | null>(null);
  const [status, setStatus] = useState("Locatie laden...");

  useEffect(() => {
    void params.then((resolved) => setLocationId(resolved.id));
  }, [params]);

  useEffect(() => {
    if (!locationId) {
      return;
    }

    void (async () => {
      const response = await fetch(`/api/locations/${locationId}`);
      if (!response.ok) {
        setStatus("Locatie niet gevonden.");
        return;
      }
      const data = (await response.json()) as { location: LocationRecord };
      setLocation(data.location);
      setStatus("Geladen.");
    })();
  }, [locationId]);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "1rem", display: "grid", gap: "1rem" }}>
      <Link href="/">Terug naar kaart</Link>
      {location ? (
        <section style={{ background: "#fff", border: "1px solid #dbe2f0", borderRadius: 12, padding: "1rem" }}>
          <h1 style={{ marginTop: 0 }}>{location.name}</h1>
          <p>{location.address}</p>
          <p>{availabilityText(location.availabilityType)}</p>
          <p>
            Bevestigd: {location.confirmCount} | Afgekeurd: {location.denyCount} | Vertrouwensscore:{" "}
            {location.trustScore}
          </p>
          <NavAppButtons location={location} />
          <div style={{ marginTop: "0.8rem" }}>
            <TemperatureVoteButtons location={location} onVoted={setLocation} />
          </div>
          <div style={{ marginTop: "0.8rem" }}>
            <VoteButtons location={location} onVoted={setLocation} />
          </div>
        </section>
      ) : (
        <p>{status}</p>
      )}
    </main>
  );
}
