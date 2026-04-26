"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);

  const photoPreviewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  function buildFormData(confirmDifferentLocation: boolean): FormData {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("address", address);
    formData.append("availabilityType", availabilityType);
    if (note.trim() !== "") {
      formData.append("note", note.trim());
    }
    formData.append("lat", String(currentLocation.lat));
    formData.append("lng", String(currentLocation.lng));
    if (confirmDifferentLocation) {
      formData.append("confirmDifferentLocation", "true");
    }
    if (photo) {
      formData.append("photo", photo);
    }
    return formData;
  }

  async function submitSubmission(confirmDifferentLocation: boolean): Promise<void> {
    setStatus("Bezig met versturen...");

    const response = await fetch("/api/submissions", {
      method: "POST",
      body: buildFormData(confirmDifferentLocation)
    });

    if (response.ok) {
      setStatus("Inzending ontvangen, bedankt!");
      setDuplicateMessage(null);
      setDuplicateCandidates([]);
      setName("");
      setAddress("");
      setNote("");
      setPhoto(null);
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
    <form onSubmit={handleSubmit} className="ios-form-inner">
      <h2 className="ios-text-title">Nieuwe locatie toevoegen</h2>
      <p className="ios-text-footnote">We gebruiken je huidige locatie als basis voor deze inzending.</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Naam van de winkel"
        autoComplete="off"
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
        placeholder="Adres"
        autoComplete="street-address"
      />
      <select
        value={availabilityType}
        onChange={(e) => setAvailabilityType(e.target.value as AvailabilityType)}
        aria-label="Beschikbaarheid in de winkel"
      >
        <option value="cold">Koud</option>
        <option value="shelf">Kamertemperatuur</option>
      </select>

      <label className="ios-text-footnote" style={{ display: "grid", gap: "0.35rem" }}>
        Optionele foto (max. 4 MB, JPEG/PNG/WebP)
        <input
          type="file"
          className="ios-pill-browse"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setPhoto(file);
          }}
        />
      </label>
      {photoPreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob: preview URL is not compatible with next/image without a custom loader
        <img
          src={photoPreviewUrl}
          alt="Voorbeeld van gekozen foto"
          className="ios-pill-preview"
        />
      ) : null}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optionele notitie"
        rows={3}
      />

      <button type="submit" className="ios-btn ios-btn--primary" style={{ width: "100%", minHeight: 48, marginTop: "0.25rem" }}>
        Versturen
      </button>
      {duplicateMessage ? (
        <div className="ios-duplicate" style={{ margin: "0" }}>
          <p className="ios-text-footnote" style={{ color: "var(--ios-label)" }}>
            {duplicateMessage}
          </p>
          {duplicateCandidates.map((candidate) => (
            <div key={candidate.id} className="ios-candidate">
              <p className="ios-text-body" style={{ fontSize: "0.875rem" }}>
                <strong>{candidate.name}</strong> <span className="ios-dim-text">·</span> {candidate.address}
              </p>
              <p className="ios-text-caption-2" style={{ marginTop: 4 }}>
                Afstand: {candidate.distanceKm.toFixed(2)} km &middot; match {Math.round(candidate.duplicateScore * 100)}%
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => void submitSubmission(true)}
            className="ios-btn ios-btn--secondary"
            style={{ width: "100%", marginTop: "0.25rem" }}
          >
            Toch als nieuwe locatie toevoegen
          </button>
        </div>
      ) : null}
      {status ? <p className="ios-status-ok" style={{ margin: 0 }}>{status}</p> : null}
    </form>
  );
}
