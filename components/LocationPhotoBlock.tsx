"use client";

import Image from "next/image";
import { useId, useState, type ChangeEvent } from "react";
import type { LocationRecord } from "@/lib/types";

type Props = {
  location: LocationRecord;
  onUpdated: (location: LocationRecord) => void;
  variant: "sheet" | "detail";
};

export default function LocationPhotoBlock({ location, onUpdated, variant }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = useId();
  const inputId = `loc-ph-${id}`;

  const isSheet = variant === "sheet";

  async function onFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setBusy(true);
    setErr(null);
    const form = new FormData();
    form.append("photo", file);
    const response = await fetch(`/api/locations/${location.id}/photo`, {
      method: "POST",
      body: form
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setErr(data.error ?? "Upload is mislukt.");
      setBusy(false);
      return;
    }
    const data = (await response.json()) as { location: LocationRecord };
    onUpdated(data.location);
    setBusy(false);
  }

  return (
    <div className={isSheet ? "ios-location-photo-block--sheet" : "ios-location-photo-block--detail"}>
      {location.photoUrl ? (
        <div
          className={isSheet ? "ios-location-photo-frame--sheet" : "ios-hero"}
          style={!isSheet ? { margin: "0.75rem 0" } : undefined}
        >
          <Image
            className="ios-hero--inner"
            src={location.photoUrl}
            alt={`Foto bij ${location.name}`}
            width={800}
            height={isSheet ? 320 : 600}
            sizes={isSheet ? "min(100vw, 32rem) 100vw" : "(max-width: 760px) 100vw, 640px"}
            style={
              isSheet
                ? { width: "100%", height: "auto", maxHeight: "10rem", objectFit: "cover" as const }
                : { width: "100%", height: "auto", objectFit: "contain" as const }
            }
          />
        </div>
      ) : null}
      <p className="ios-location-photo-toolbar" style={{ margin: isSheet ? 0 : "0.4rem 0" }}>
        {busy ? (
          <span className="ios-btn ios-btn--secondary" style={{ cursor: "default", opacity: 0.8 }}>
            Uploaden…
          </span>
        ) : (
          <>
            <input
              id={inputId}
              type="file"
              className="visually-hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void onFile(e)}
            />
            <label
              htmlFor={inputId}
              className="ios-btn ios-btn--secondary"
              style={{ cursor: "pointer" }}
            >
              {location.photoUrl ? "Foto wijzigen" : "Foto toevoegen"}
            </label>
          </>
        )}
      </p>
      {err ? (
        <p className="ios-text-footnote" style={{ color: "#b00020", margin: "0.25rem 0 0" }}>
          {err}
        </p>
      ) : null}
    </div>
  );
}
