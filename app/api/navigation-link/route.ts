import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocationById } from "@/lib/services/locationService";
import { buildNavigationUrl } from "@/lib/services/navigationService";

const querySchema = z.object({
  locationId: z.string().min(2),
  app: z.enum(["google", "waze", "flitsmeister", "apple"])
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parseResult = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  if (!parseResult.success) {
    return NextResponse.json({ error: "Ongeldige query" }, { status: 400 });
  }

  const location = await getLocationById(parseResult.data.locationId);
  if (!location) {
    return NextResponse.json({ error: "Locatie niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({
    url: buildNavigationUrl(parseResult.data.app, {
      lat: location.lat,
      lng: location.lng,
      name: location.name
    })
  });
}
