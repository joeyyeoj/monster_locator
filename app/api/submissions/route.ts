import { NextResponse } from "next/server";
import { z } from "zod";
import type { DuplicateCandidate } from "@/lib/types";
import { getClientHash } from "@/lib/services/clientIdentity";
import { createSubmission } from "@/lib/services/locationService";
import { consumeRateLimit } from "@/lib/services/rateLimiter";
import { geocodeAddressInNetherlands } from "@/lib/services/geocodingService";

const submissionSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().min(4).max(180),
  availabilityType: z.enum(["cold", "shelf"]),
  note: z.string().max(280).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  confirmDifferentLocation: z.boolean().optional()
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parseResult = submissionSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Ongeldige inzending", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const clientHash = await getClientHash();
  const isAllowed = consumeRateLimit(`submission:${clientHash}`, 6, 60 * 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Te veel inzendingen. Probeer het later opnieuw." },
      { status: 429 }
    );
  }

  const coords =
    parseResult.data.lat !== undefined && parseResult.data.lng !== undefined
      ? { lat: parseResult.data.lat, lng: parseResult.data.lng }
      : await geocodeAddressInNetherlands(parseResult.data.name, parseResult.data.address);
  if (!coords) {
    return NextResponse.json(
      { error: "Adres kon niet worden gevonden. Controleer de invoer." },
      { status: 400 }
    );
  }

  const result = await createSubmission(
    {
      ...parseResult.data,
      placeType: "supermarket",
      lat: coords.lat,
      lng: coords.lng
    },
    clientHash,
    { forceCreate: parseResult.data.confirmDifferentLocation === true }
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
