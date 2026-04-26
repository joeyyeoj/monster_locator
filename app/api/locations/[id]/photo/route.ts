import { NextResponse } from "next/server";
import { getClientHash } from "@/lib/services/clientIdentity";
import { setLocationPhotoUrl } from "@/lib/services/locationService";
import { consumeRateLimit } from "@/lib/services/rateLimiter";
import { uploadLocationPhotoToBlob } from "@/lib/services/submissionPhotoUpload";

type Params = {
  params: Promise<{ id: string }>;
};

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
      {
        error: "Foto-upload is op deze omgeving niet geconfigureerd. Probeer later opnieuw of neem contact op."
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: "Foto kon niet worden geüpload." }, { status: 500 });
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const { id: locationId } = await params;
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Gebruik multipart met een `photo` bestand." }, { status: 415 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulier kon niet worden gelezen." }, { status: 400 });
  }

  const raw = formData.get("photo");
  const photoFile =
    raw instanceof File && raw.size > 0 && String(raw.name ?? "") !== "" ? raw : null;
  if (!photoFile) {
    return NextResponse.json({ error: "Kies een foto (JPEG, PNG of WebP)." }, { status: 400 });
  }

  const clientHash = await getClientHash();
  const isAllowed = consumeRateLimit(`location-photo:${clientHash}`, 8, 60 * 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Te veel fotouploads. Probeer het over een uur opnieuw." },
      { status: 429 }
    );
  }

  let url: string;
  try {
    url = await uploadLocationPhotoToBlob(photoFile, locationId);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    return photoUploadErrorResponse(code);
  }

  const location = await setLocationPhotoUrl(locationId, url);
  if (!location) {
    return NextResponse.json({ error: "Locatie niet gevonden." }, { status: 404 });
  }

  return NextResponse.json({ location });
}
