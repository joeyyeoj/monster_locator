"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import LocationCard from "@/components/LocationCard";
import SubmissionForm from "@/components/SubmissionForm";
import TemperatureVoteButtons from "@/components/TemperatureVoteButtons";
import VoteButtons from "@/components/VoteButtons";
import type { NearbyLocation } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const defaultCenter = { lat: 52.0907, lng: 5.1214 };

function LocationShareIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.94 8.94 0 0 0 13 3.06V1h-2v2.06A8.94 8.94 0 0 0 3.06 11H1v2h2.06A8.94 8.94 0 0 0 11 20.94V23h2v-2.06A8.94 8.94 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </svg>
  );
}

function IconAddPlace() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

/** Store / winkel (Material-style storefront) for “dichtstbijzijnde winkels” */
function IconStore() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
    </svg>
  );
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
  const [showLocationShareButton, setShowLocationShareButton] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      queueMicrotask(() => {
        setShowLocationShareButton(false);
      });
      return;
    }
    const permissions = navigator.permissions;
    if (!permissions?.query) {
      return;
    }
    const cleanup: { run?: () => void } = {};
    permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        const onChange = (): void => {
          setShowLocationShareButton(result.state !== "granted");
        };
        onChange();
        result.addEventListener("change", onChange);
        cleanup.run = () => {
          result.removeEventListener("change", onChange);
        };
      })
      .catch(() => {
        /* Rely on getCurrentPosition success in browsers without Permissions API. */
      });
    return () => {
      cleanup.run?.();
    };
  }, []);

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
    const n = data.locations.length;
    if (n > 0) {
      setSelected(data.locations[0]);
      const locWord = n === 1 ? "locatie" : "locaties";
      setStatus(`${n} ${locWord} geladen binnen ${targetRadius} km.`);
    } else {
      setSelected(null);
      setStatus(`Nog geen locaties binnen ${targetRadius} km.`);
    }
  }

  function requestUserLocation(options?: { silent?: boolean }): void {
    if (!navigator.geolocation) {
      setStatus("Locatie delen wordt niet ondersteund in deze browser.");
      setShowLocationShareButton(false);
      return;
    }

    if (!options?.silent) {
      setStatus("Toestemming voor locatie opvragen...");
    }
    navigator.geolocation.getCurrentPosition(
      (coords) => {
        setShowLocationShareButton(false);
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
      queueMicrotask(() => {
        setShowLocationShareButton(false);
      });
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
    <main className="ios-page-map">
      <MapView center={position} locations={locations} onSelect={setSelected} />

      <div className="ios-top-overlay">
        <div className="ios-top-overlay-main">
          <div className="ios-frost ios-frost--top">
            <h1 className="ios-text-title">Waar kan ik een monstertje halen?</h1>
            <p className="ios-text-footnote">{status}</p>
            <p className="ios-legend">
              Legenda: <span className="ios-mono-slab" aria-label="Koud">🧊</span> koud &middot;{" "}
              <span className="ios-mono-slab" aria-label="Kamertemperatuur">🥤</span> kamertemperatuur &middot;{" "}
              <span className="ios-mono-slab" aria-label="Beide">🧊🥤</span> beide &middot; <span className="ios-mono-slab" aria-label="Onbekend">❔</span> onbekend
            </p>
          </div>
        </div>
        <div className="ios-bbar-stacked" role="toolbar" aria-label="Kaartacties">
          {showLocationShareButton ? (
            <button
              type="button"
              onClick={() => requestUserLocation()}
              className="ios-bbar-icon-btn"
              aria-label="Deel locatie"
              title="Deel locatie"
            >
              <LocationShareIcon />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowSubmissionModal(true)}
            className="ios-bbar-icon-btn"
            aria-label="Nieuwe locatie toevoegen"
            title="Nieuwe locatie"
          >
            <IconAddPlace />
          </button>
          <button
            type="button"
            onClick={() => setShowClosestModal(true)}
            className="ios-bbar-icon-btn"
            aria-label="Dichtstbijzijnde winkels"
            title="Dichtstbijzijnde winkels"
          >
            <IconStore />
          </button>
        </div>
      </div>

      {selected ? (
        <div className="ios-floating-card">
          <div className="ios-card ios-card--sheet">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="ios-icon-btn"
              aria-label="Sluiten"
              title="Sluiten"
            >
              <IconClose />
            </button>
            <div className="ios-grabber" aria-hidden />
            <div style={{ paddingRight: "4.5rem" }}>
              <p className="ios-text-title" style={{ fontSize: "1.05rem" }}>
                {selected.name}
              </p>
              <p className="ios-text-footnote ios-card-locline" style={{ marginTop: "0.4rem" }}>
                {selected.address}
                <span aria-hidden="true"> - </span>
                <span className="ios-mono-slab" style={{ color: "var(--ios-label-secondary)" }}>
                  {selected.distanceKm.toFixed(2)} km
                </span>
              </p>
              <p className="ios-vote-stats-line" style={{ margin: 0, marginTop: "0.4rem" }}>
                <span className="ios-vote-stat-yes">Bevestigd: {selected.confirmCount}</span>
                <span className="ios-vote-sep" aria-hidden>
                  {" "}
                  ·{" "}
                </span>
                <span className="ios-vote-stat-no">Afgekeurd: {selected.denyCount}</span>
                <span className="ios-vote-sep" aria-hidden>
                  {" "}
                  ·{" "}
                </span>
                <span className="ios-vote-stat-trust">Vertrouwen: {selected.trustScore}</span>
              </p>
            </div>
            <VoteButtons
              location={selected}
              onVoted={(updated) => {
                setSelected((current) => (current && current.id === updated.id ? { ...current, ...updated } : current));
                setLocations((current) =>
                  current.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry))
                );
              }}
            />
            <TemperatureVoteButtons
              location={selected}
              onVoted={(updated) => {
                setSelected((current) => (current && current.id === updated.id ? { ...current, ...updated } : current));
                setLocations((current) =>
                  current.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry))
                );
              }}
            />
          </div>
        </div>
      ) : null}

      {showSubmissionModal ? (
        <div className="ios-scrim" role="presentation">
          <div
            className="ios-sheet"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Nieuwe locatie"
          >
            <button
              type="button"
              onClick={() => setShowSubmissionModal(false)}
              className="ios-icon-btn"
              aria-label="Sluiten"
              title="Sluiten"
            >
              <IconClose />
            </button>
            <div className="ios-grabber" aria-hidden />
            <p className="ios-text-title" style={{ margin: "0 3rem 0 1rem" }}>
              Nieuwe locatie
            </p>
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
        <div className="ios-scrim" role="presentation">
          <div
            className="ios-sheet"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Dichtstbijzijnde winkels"
          >
            <button
              type="button"
              onClick={() => setShowClosestModal(false)}
              className="ios-icon-btn"
              aria-label="Sluiten"
              title="Sluiten"
            >
              <IconClose />
            </button>
            <div className="ios-grabber" aria-hidden />
            <p className="ios-text-title" style={{ margin: "0 3rem 0 1rem" }}>
              Dichtstbijzijnde winkels
            </p>
            <div className="ios-filters-row" style={{ margin: "0 1rem 0.5rem" }}>
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
                className="ios-btn ios-btn--secondary"
              >
                Vernieuwen
              </button>
            </div>
            <div className="ios-filters-row" style={{ margin: "0 1rem" }}>
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
            <div style={{ maxHeight: "55dvh", overflowY: "auto", padding: "0 0.5rem" }}>
              {locations.map((location) => (
                <div key={location.id} style={{ marginBottom: "0.5rem" }}>
                  <LocationCard
                    location={location}
                    onSelect={(entry) => {
                      setSelected(entry);
                      setShowClosestModal(false);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
