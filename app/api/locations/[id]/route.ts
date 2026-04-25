import { NextResponse } from "next/server";
import { getLocationById } from "@/lib/services/locationService";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const location = await getLocationById(id);

  if (!location) {
    return NextResponse.json({ error: "Locatie niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({ location });
}
