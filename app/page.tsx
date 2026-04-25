"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import LocationCard from "@/components/LocationCard";
import NavAppButtons from "@/components/NavAppButtons";
import SubmissionForm from "@/components/SubmissionForm";
import TemperatureVoteButtons from "@/components/TemperatureVoteButtons";
import VoteButtons from "@/components/VoteButtons";
import type { NearbyLocation } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const defaultCenter = { lat: 52.0907, lng: 5.1214 };

function getTrustBadge(score: number): string {
  if (score >= 3) {
    return "Bevestigd";
  }
  if (score < 0) {
    return "Betwist";
  }
  return "Nieuw";
}

export default function HomePage() {
  const [position, setPosition] = useState(defaultCenter);
  const [radius, setRadius] = useState(25);
  const [temperatureFilter, setTemperatureFilter] = useState<
    "all" | "cold" | "shelf" | "both" | "unknown"
  >(
    "all"
  );
  const [locations, setLocations] = useState<NearbyLocation[]>([]);
  const [selected, setSelected] = useState<NearbyLocation | null>(null);
  const [status, setStatus] = useState("Locatie ophalen...");
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showClosestModal, setShowClosestModal] = useState(false);

  async function loadNearby(target = position, targetRadius = radius): Promise<void> {
    setStatus("Locaties laden...");
    const response = await fetch(
      `/api/locations/nearby?lat=${target.lat}&lng=${target.lng}&radius=${targetRadius}&temperature=${temperatureFilter}`
    );

    if (!response.ok) {
      setStatus("Kon locaties niet laden.");
      return;
    }

    const data = (await response.json()) as { locations: NearbyLocation[] };
    setLocations(data.locations);
    if (data.locations.length > 0) {
      setSelected(data.locations[0]);
      setStatus(`${data.locations.length} locaties geladen.`);
    } else {
      setSelected(null);
      setStatus("Nog geen locaties in deze straal.");
    }
  }

  function requestUserLocation(options?: { silent?: boolean }): void {
    if (!navigator.geolocation) {
      setStatus("Locatie delen wordt niet ondersteund in deze browser.");
      return;
    }

    if (!options?.silent) {
      setStatus("Toestemming voor locatie opvragen...");
    }
    navigator.geolocation.getCurrentPosition(
      (coords) => {
        const nextPosition = {
          lat: coords.coords.latitude,
          lng: coords.coords.longitude
        };
        setPosition(nextPosition);
        void loadNearby(nextPosition);
      },
      () => {
        setStatus("Locatietoegang geweigerd.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      const timer = setTimeout(() => {
        void loadNearby(defaultCenter);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      requestUserLocation({ silent: true });
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temperatureFilter]);

  return (
    <main style={{ position: "relative", height: "100dvh", width: "100%" }}>
      <MapView center={position} locations={locations} onSelect={setSelected} />

      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 500,
          background: "rgba(255, 255, 255, 0.94)",
          border: "1px solid #d4ddd7",
          borderRadius: 12,
          padding: "0.6rem 0.8rem",
          display: "grid",
          gap: "0.4rem",
          boxShadow: "0 8px 20px rgba(10, 24, 12, 0.12)"
        }}
      >
        <strong style={{ color: "#2e3330", letterSpacing: "0.02em" }}>
          Waar kan ik een monstertje halen?
        </strong>
        <small style={{ color: "#3d4541" }}>{status}</small>
        <small style={{ color: "#5a675f" }}>
          Legenda: 🧊 Koud | 🥤 Kamertemperatuur | 🧊🥤 Beide | ❔ Onbekend
        </small>
        <button
          type="button"
          onClick={() => requestUserLocation()}
          style={{
            border: "1px solid #8edb79",
            borderRadius: 10,
            background: "#edf9e8",
            padding: "0.45rem 0.65rem",
            justifySelf: "start",
            color: "#17461a",
            fontWeight: 700
          }}
        >
          Deel locatie
        </button>
      </div>

      {selected ? (
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 84,
            zIndex: 500,
            background: "rgba(255, 255, 255, 0.98)",
            border: "1px solid #d4ddd7",
            borderRadius: 16,
            padding: "0.8rem",
            display: "grid",
            gap: "0.5rem",
            maxHeight: "40dvh",
            overflowY: "auto"
          }}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              border: "1px solid #d4ddd7",
              borderRadius: 10,
              padding: "0.35rem 0.55rem",
              background: "#f8faf9",
              color: "#2e3330",
              zIndex: 2
            }}
          >
            Sluiten
          </button>
          <div
            style={{
              width: 42,
              height: 5,
              borderRadius: 999,
              background: "#8edb79",
              justifySelf: "center"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", paddingRight: "5rem" }}>
            <strong>{selected.name}</strong>
            <span>{selected.distanceKm.toFixed(2)} km</span>
          </div>
          <small>{selected.address}</small>
          <small>Betrouwbaarheidsbadge: {getTrustBadge(selected.trustScore)}</small>
          <NavAppButtons location={selected} />
          <TemperatureVoteButtons
            location={selected}
            onVoted={(updated) => {
              setSelected((current) => (current && current.id === updated.id ? { ...current, ...updated } : current));
              setLocations((current) =>
                current.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry))
              );
            }}
          />
          <VoteButtons
            location={selected}
            onVoted={(updated) => {
              setSelected((current) => (current && current.id === updated.id ? { ...current, ...updated } : current));
              setLocations((current) =>
                current.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry))
              );
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          zIndex: 500,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.6rem"
        }}
      >
        <button
          type="button"
          onClick={() => setShowSubmissionModal(true)}
            style={{
              border: "1px solid #8edb79",
              borderRadius: 14,
              background: "#edf9e8",
              padding: "0.95rem",
              color: "#17461a",
              fontWeight: 700
            }}
        >
          Nieuwe locatie
        </button>
        <button
          type="button"
          onClick={() => setShowClosestModal(true)}
            style={{
              border: "1px solid #8edb79",
              borderRadius: 14,
              background: "#edf9e8",
              padding: "0.95rem",
              color: "#17461a",
              fontWeight: 700
            }}
        >
          Dichtstbijzijnde winkels
        </button>
      </div>

      {showSubmissionModal ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 700,
            background: "rgba(5, 11, 6, 0.25)",
            padding: "1rem",
            display: "grid",
            alignItems: "end"
          }}
        >
          <div
            style={{
              position: "relative",
              background: "rgba(255, 255, 255, 0.98)",
              borderRadius: 16,
              padding: "1rem",
              display: "grid",
              gap: "0.7rem",
              maxHeight: "70dvh",
              overflowY: "auto"
            }}
          >
            <button
              type="button"
              onClick={() => setShowSubmissionModal(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                border: "1px solid #d4ddd7",
                borderRadius: 10,
                padding: "0.35rem 0.55rem",
                background: "#f8faf9",
                color: "#2e3330",
                zIndex: 2
              }}
            >
              Sluiten
            </button>
            <div
              style={{
                width: 42,
                height: 5,
                borderRadius: 999,
                background: "#8edb79",
                justifySelf: "center"
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "5rem" }}>
              <strong style={{ color: "#2e3330" }}>Nieuwe locatie</strong>
            </div>
            <SubmissionForm
              currentLocation={position}
              onSubmitted={async () => {
                await loadNearby();
                setShowSubmissionModal(false);
              }}
            />
          </div>
        </div>
      ) : null}

      {showClosestModal ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 700,
            background: "rgba(5, 11, 6, 0.25)",
            padding: "1rem",
            display: "grid",
            alignItems: "end"
          }}
        >
          <div
            style={{
              position: "relative",
              background: "rgba(255, 255, 255, 0.98)",
              borderRadius: 16,
              padding: "1rem",
              display: "grid",
              gap: "0.7rem",
              maxHeight: "70dvh",
              overflowY: "auto"
            }}
          >
            <button
              type="button"
              onClick={() => setShowClosestModal(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                border: "1px solid #d4ddd7",
                borderRadius: 10,
                padding: "0.35rem 0.55rem",
                background: "#f8faf9",
                color: "#2e3330",
                zIndex: 2
              }}
            >
              Sluiten
            </button>
            <div
              style={{
                width: 42,
                height: 5,
                borderRadius: 999,
                background: "#8edb79",
                justifySelf: "center"
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "5rem" }}>
              <strong style={{ color: "#2e3330" }}>Dichtstbijzijnde winkels</strong>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <label htmlFor="radius-km">Straal (km)</label>
              <input
                id="radius-km"
                type="number"
                min={1}
                max={100}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                style={{ width: 90 }}
              />
              <button
                type="button"
                onClick={() => void loadNearby(position, radius)}
                style={{
                  border: "1px solid #c9d3cd",
                  borderRadius: 10,
                  padding: "0.4rem 0.6rem",
                  background: "#f6f8f7",
                  color: "#2e3a33"
                }}
              >
                Vernieuwen
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <label htmlFor="temperature-filter">Temperatuur</label>
              <select
                id="temperature-filter"
                value={temperatureFilter}
                onChange={(event) =>
                  setTemperatureFilter(
                    event.target.value as "all" | "cold" | "shelf" | "both" | "unknown"
                  )
                }
              >
                <option value="all">Alles</option>
                <option value="cold">Koud</option>
                <option value="shelf">Kamertemperatuur</option>
                <option value="both">Beide</option>
                <option value="unknown">Onbekend</option>
              </select>
            </div>
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onSelect={(entry) => {
                  setSelected(entry);
                  setShowClosestModal(false);
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
