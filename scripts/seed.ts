import { seedLocations } from "@/lib/data/seedLocations";
import { prisma } from "@/lib/db/prisma";
import type { SeedLocationPayload } from "@/lib/types";

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

const overpassQuery = `
[out:json][timeout:90];
area["ISO3166-1"="NL"][admin_level=2]->.nl;
(
  node["shop"="supermarket"]["brand"~"^(Jumbo|PLUS|Hoogvliet)$"](area.nl);
  way["shop"="supermarket"]["brand"~"^(Jumbo|PLUS|Hoogvliet)$"](area.nl);
  relation["shop"="supermarket"]["brand"~"^(Jumbo|PLUS|Hoogvliet)$"](area.nl);
);
out center;
`;

function createAddress(tags: Record<string, string>): string {
  const street = tags["addr:street"] ?? "";
  const houseNumber = tags["addr:housenumber"] ?? "";
  const postcode = tags["addr:postcode"] ?? "";
  const city = tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? "";
  const firstPart = [street, houseNumber].filter(Boolean).join(" ").trim();
  const secondPart = [postcode, city].filter(Boolean).join(" ").trim();
  const address = [firstPart, secondPart].filter(Boolean).join(", ").trim();
  return address || "Adres onbekend, Nederland";
}

function mapOverpassElementToLocation(element: OverpassElement): SeedLocationPayload | null {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!lat || !lng) {
    return null;
  }

  const brand = tags.brand?.trim();
  if (!brand || !["Jumbo", "PLUS", "Hoogvliet"].includes(brand)) {
    return null;
  }

  const name = (tags.name?.trim() || brand).slice(0, 120);
  const address = createAddress(tags).slice(0, 180);
  const placeType = "supermarket";

  return {
    name,
    address,
    placeType,
    lat,
    lng,
    availabilityType: "unknown"
  };
}

async function fetchChainLocationsFromOverpass(): Promise<SeedLocationPayload[]> {
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "User-Agent": "monster-locator/0.1.0 (seed import)"
    },
    body: overpassQuery
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  const parsed = data.elements
    .map((element) => mapOverpassElementToLocation(element))
    .filter((entry): entry is SeedLocationPayload => entry !== null);

  const deduped = new Map<string, SeedLocationPayload>();
  for (const location of parsed) {
    const key = `${location.name.toLowerCase()}|${location.address.toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, location);
    }
  }
  return [...deduped.values()];
}

async function main(): Promise<void> {
  let combinedSeeds: SeedLocationPayload[] = [...seedLocations];
  try {
    const chainLocations = await fetchChainLocationsFromOverpass();
    combinedSeeds = [...seedLocations, ...chainLocations];
    console.log(`OSM import succesvol: ${chainLocations.length} supermarktlocaties gevonden.`);
  } catch (error) {
    console.warn("OSM import mislukt, verder met basis-seedlijst.", error);
  }

  const deduped = new Map<string, SeedLocationPayload>();
  for (const location of combinedSeeds) {
    const key = `${location.name.toLowerCase()}|${location.address.toLowerCase()}`;
    deduped.set(key, location);
  }

  for (const location of deduped.values()) {
    await prisma.location.upsert({
      where: {
        name_address: {
          name: location.name,
          address: location.address
        }
      },
      create: {
        name: location.name,
        address: location.address,
        placeType: location.placeType,
        lat: location.lat,
        lng: location.lng,
        sourceType: "seeded",
        availabilityType: location.availabilityType
      },
      update: {
        placeType: location.placeType,
        lat: location.lat,
        lng: location.lng,
        availabilityType: location.availabilityType
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
