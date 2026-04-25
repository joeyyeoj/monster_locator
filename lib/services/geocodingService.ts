type GeocodeResult = {
  lat: number;
  lng: number;
};

export async function geocodeAddressInNetherlands(
  name: string,
  address: string
): Promise<GeocodeResult | null> {
  const query = `${name}, ${address}, Nederland`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "nl");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "monster-locator/0.1.0 (submission geocoder)"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (data.length === 0) {
    return null;
  }

  const first = data[0];
  return {
    lat: Number(first.lat),
    lng: Number(first.lon)
  };
}
