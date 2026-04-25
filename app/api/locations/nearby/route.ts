import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNearbyLocations } from "@/lib/services/locationService";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(25),
  temperature: z.enum(["all", "cold", "shelf", "both", "unknown"]).default("all")
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parseResult = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Ongeldige queryparameters", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { lat, lng, radius, temperature } = parseResult.data;
  const locations = await getNearbyLocations({ lat, lng, radiusKm: radius });
  const filteredLocations =
    temperature === "all"
      ? locations
      : locations.filter((location) => location.availabilityType === temperature);
  return NextResponse.json({ locations: filteredLocations });
}
