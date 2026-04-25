type NavigationApp = "google" | "waze" | "flitsmeister" | "apple";

export function buildNavigationUrl(
  app: NavigationApp,
  destination: { lat: number; lng: number; name: string }
): string {
  const { lat, lng, name } = destination;
  const encodedName = encodeURIComponent(name);

  if (app === "google") {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedName}`;
  }

  if (app === "waze") {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }

  if (app === "flitsmeister") {
    return `https://www.flitsmeister.com/route?to=${lat},${lng}`;
  }

  return `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodedName}`;
}
