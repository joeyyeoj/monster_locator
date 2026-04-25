const PRODUCTION_SITE_URL = "https://waarkanikeenmonstertjehalen.nl";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return PRODUCTION_SITE_URL;
}
