import { NextResponse } from "next/server";
import { z } from "zod";
import type { DuplicateCandidate } from "@/lib/types";
import { getClientHash } from "@/lib/services/clientIdentity";
import { createSubmission } from "@/lib/services/locationService";
import { consumeRateLimit } from "@/lib/services/rateLimiter";
import { geocodeAddressInNetherlands } from "@/lib/services/geocodingService";
import { uploadSubmissionPhotoToBlob } from "@/lib/services/submissionPhotoUpload";

const submissionFieldsSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().min(4).max(180),
  availabilityType: z.enum(["cold", "shelf"]),
  note: z.string().max(280).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  confirmDifferentLocation: z.boolean().optional()
});

function readTrimmedString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function readOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readOptionalBoolean(formData: FormData, key: string): boolean | undefined {
  const value = formData.get(key);
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const normalized = String(value).toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return undefined;
}

function photoUploadErrorResponse(code: string): NextResponse {
  if (code === "FILE_TOO_LARGE") {
    return NextResponse.json({ error: "Foto is te groot (max. 4 MB)." }, { status: 400 });
  }
  if (code === "INVALID_FILE_TYPE") {
    return NextResponse.json({ error: "Alleen JPEG-, PNG- of WebP-foto's zijn toegestaan." }, { status: 400 });
  }
  if (code === "EMPTY_FILE") {
    return NextResponse.json({ error: "De gekozen foto is leeg." }, { status: 400 });
  }
  if (code === "MISSING_BLOB_TOKEN") {
    return NextResponse.json(
      { error: "Foto-upload is op deze omgeving niet geconfigureerd. Probeer zonder foto of neem contact op." },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: "Foto kon niet worden geüpload." }, { status: 500 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Gebruik multipart/form-data voor inzendingen (inclusief optionele foto)." },
      { status: 415 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulier kon niet worden gelezen." }, { status: 400 });
  }

  const noteRaw = readTrimmedString(formData, "note");
  const parsedFields = submissionFieldsSchema.safeParse({
    name: readTrimmedString(formData, "name"),
    address: readTrimmedString(formData, "address"),
    availabilityType: readTrimmedString(formData, "availabilityType"),
    note: noteRaw === "" ? undefined : noteRaw,
    lat: readOptionalNumber(formData, "lat"),
    lng: readOptionalNumber(formData, "lng"),
    confirmDifferentLocation: readOptionalBoolean(formData, "confirmDifferentLocation")
  });
  if (!parsedFields.success) {
    return NextResponse.json(
      { error: "Ongeldige inzending", details: parsedFields.error.flatten() },
      { status: 400 }
    );
  }
  const fields = parsedFields.data;

  const clientHash = await getClientHash();
  const isAllowed = consumeRateLimit(`submission:${clientHash}`, 6, 60 * 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Te veel inzendingen. Probeer het later opnieuw." },
      { status: 429 }
    );
  }

  const rawPhoto = formData.get("photo");
  const photoFile =
    rawPhoto instanceof File && rawPhoto.size > 0 && rawPhoto.name !== "" ? rawPhoto : null;

  let photoUrl: string | undefined;
  if (photoFile) {
    try {
      photoUrl = await uploadSubmissionPhotoToBlob(photoFile);
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNKNOWN";
      return photoUploadErrorResponse(code);
    }
  }

  const coords =
    fields.lat !== undefined && fields.lng !== undefined
      ? { lat: fields.lat, lng: fields.lng }
      : await geocodeAddressInNetherlands(fields.name, fields.address);
  if (!coords) {
    return NextResponse.json(
      { error: "Adres kon niet worden gevonden. Controleer de invoer." },
      { status: 400 }
    );
  }

  const { confirmDifferentLocation, ...fieldPayload } = fields;
  const result = await createSubmission(
    {
      ...fieldPayload,
      placeType: "supermarket",
      lat: coords.lat,
      lng: coords.lng,
      photoUrl: photoUrl ?? null
    },
    clientHash,
    { forceCreate: confirmDifferentLocation === true }
  );

  if (result.status === "duplicate") {
    return NextResponse.json(
      {
        status: "duplicate",
        message:
          "Deze locatie lijkt op een bestaande winkel in de buurt. Controleer eerst de suggesties hieronder.",
        locationId: result.locationId,
        candidates: (result.candidates ?? []) satisfies DuplicateCandidate[]
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    status: "created",
    locationId: result.locationId
  });
}
