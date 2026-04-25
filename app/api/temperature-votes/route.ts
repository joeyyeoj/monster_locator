import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientHash } from "@/lib/services/clientIdentity";
import { castTemperatureVote } from "@/lib/services/locationService";
import { consumeRateLimit } from "@/lib/services/rateLimiter";

const temperatureVoteSchema = z.object({
  locationId: z.string().min(2),
  availabilityType: z.enum(["cold", "shelf", "both"])
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parseResult = temperatureVoteSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Ongeldige temperatuurstem", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const clientHash = await getClientHash();
  const isAllowed = consumeRateLimit(`temp-vote:${clientHash}`, 40, 60 * 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Te veel temperatuurstemmen. Probeer het later opnieuw." },
      { status: 429 }
    );
  }

  const location = await castTemperatureVote(
    parseResult.data.locationId,
    parseResult.data.availabilityType,
    clientHash
  );
  if (!location) {
    return NextResponse.json({ error: "Locatie niet gevonden." }, { status: 404 });
  }

  return NextResponse.json({ location });
}
