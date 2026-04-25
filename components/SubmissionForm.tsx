"use client";

import { FormEvent, useState } from "react";
import type { AvailabilityType, DuplicateCandidate } from "@/lib/types";

type Props = {
  currentLocation: { lat: number; lng: number };
  onSubmitted: () => Promise<void>;
};

export default function SubmissionForm({ currentLocation, onSubmitted }: Props) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>("cold");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);

  async function submitSubmission(confirmDifferentLocation: boolean): Promise<void> {
    setStatus("Bezig met versturen...");

    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        availabilityType,
        note,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        confirmDifferentLocation
      })
    });

    if (response.ok) {
      setStatus("Inzending ontvangen, bedankt!");
      setDuplicateMessage(null);
      setDuplicateCandidates([]);
      setName("");
      setAddress("");
      setNote("");
      await onSubmitted();
      return;
    }

    if (response.status === 409) {
      const duplicateData = (await response.json().catch(() => null)) as
        | { message?: string; candidates?: DuplicateCandidate[] }
        | null;
      setStatus(null);
      setDuplicateMessage(
        duplicateData?.message ?? "Deze locatie lijkt al te bestaan. Controleer de suggesties."
      );
      setDuplicateCandidates(duplicateData?.candidates ?? []);
      return;
    }

    setDuplicateMessage(null);
    setDuplicateCandidates([]);
    const data = (await response.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;
    setStatus(data?.message ?? data?.error ?? "Inzending mislukt.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await submitSubmission(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "rgba(255, 255, 255, 0.98)",
        border: "1px solid #d4ddd7",
        borderRadius: 12,
        padding: "1rem",
        display: "grid",
        gap: "0.6rem"
      }}
    >
      <strong style={{ color: "#4f9a3e", letterSpacing: "0.02em" }}>Nieuwe locatie toevoegen</strong>
      <small style={{ color: "#5a675f" }}>
        We gebruiken je huidige locatie als basis voor deze inzending.
      </small>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Naam van de winkel"
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
        placeholder="Adres"
      />
      <select
        value={availabilityType}
        onChange={(e) => setAvailabilityType(e.target.value as AvailabilityType)}
      >
        <option value="cold">Koud</option>
        <option value="shelf">Kamertemperatuur</option>
      </select>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optionele notitie"
        rows={3}
      />

      <button
        type="submit"
        style={{
          borderRadius: 10,
          padding: "0.6rem",
          border: "1px solid #8edb79",
          background: "#edf9e8",
          color: "#17461a",
          fontWeight: 700
        }}
      >
        Versturen
      </button>
      {duplicateMessage ? (
        <div
          style={{
            border: "1px solid #d9e3dc",
            borderRadius: 10,
            padding: "0.65rem",
            background: "#f7faf8",
            display: "grid",
            gap: "0.45rem"
          }}
        >
          <small style={{ color: "#36553d" }}>{duplicateMessage}</small>
          {duplicateCandidates.map((candidate) => (
            <div key={candidate.id} style={{ borderTop: "1px solid #e4ece7", paddingTop: "0.35rem" }}>
              <small>
                <strong>{candidate.name}</strong> - {candidate.address}
              </small>
              <br />
              <small style={{ color: "#5a675f" }}>
                Afstand: {candidate.distanceKm.toFixed(2)} km | Match:{" "}
                {Math.round(candidate.duplicateScore * 100)}%
              </small>
            </div>
          ))}
          <button
            type="button"
            onClick={() => void submitSubmission(true)}
            style={{
              marginTop: "0.2rem",
              borderRadius: 10,
              padding: "0.55rem 0.65rem",
              border: "1px solid #9fb9a6",
              background: "#ffffff",
              color: "#27352d",
              fontWeight: 600
            }}
          >
            Toch als nieuwe locatie toevoegen
          </button>
        </div>
      ) : null}
      {status ? <small style={{ color: "#4f9a3e" }}>{status}</small> : null}
    </form>
  );
}
