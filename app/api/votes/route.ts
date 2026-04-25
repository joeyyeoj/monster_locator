import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientHash } from "@/lib/services/clientIdentity";
import { castVote } from "@/lib/services/locationService";
import { consumeRateLimit } from "@/lib/services/rateLimiter";

const voteSchema = z.object({
  locationId: z.string().min(2),
  voteType: z.enum(["confirm", "deny"])
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parseResult = voteSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Ongeldige stemgegevens", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const clientHash = await getClientHash();
  const isAllowed = consumeRateLimit(`vote:${clientHash}`, 40, 60 * 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Te veel stemmen. Probeer het later opnieuw." },
      { status: 429 }
    );
  }

  const location = await castVote(parseResult.data.locationId, parseResult.data.voteType, clientHash);
  if (!location) {
    return NextResponse.json({ error: "Locatie niet gevonden." }, { status: 404 });
  }

  return NextResponse.json({ location });
}
