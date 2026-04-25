import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocationDetailClient from "@/components/LocationDetailClient";
import { getLocationById } from "@/lib/services/locationService";
import { getSiteUrl } from "@/lib/site";
import type { LocationRecord } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

function availabilityText(value: LocationRecord["availabilityType"]): string {
  if (value === "cold") {
    return "Koude beschikbaarheid bevestigd";
  }
  if (value === "shelf") {
    return "Meestal op kamertemperatuur verkocht";
  }
  if (value === "both") {
    return "Verkocht als koud en op kamertemperatuur";
  }
  return "Temperatuur niet bevestigd";
}

function buildLocationTitle(location: LocationRecord): string {
  return `${location.name} - Monster verkrijgbaar`;
}

function buildLocationDescription(location: LocationRecord): string {
  return `${location.name} op ${location.address}. ${availabilityText(location.availabilityType)}.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const location = await getLocationById(id);

  if (!location) {
    return {
      title: "Locatie niet gevonden",
      description: "De gevraagde locatie kon niet worden gevonden."
    };
  }

  const title = buildLocationTitle(location);
  const description = buildLocationDescription(location);
  const path = `/location/${location.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: "nl_NL",
      url: path
    },
    twitter: {
      card: "summary",
      title,
      description
    }
  };
}

export default async function LocationDetailPage({ params }: Props) {
  const { id } = await params;
  const location = await getLocationById(id);

  if (!location) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/location/${location.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: location.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressCountry: "NL"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.lat,
      longitude: location.lng
    },
    url: canonicalUrl,
    description: buildLocationDescription(location)
  };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "1rem", display: "grid", gap: "1rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/">Terug naar kaart</Link>
      <section style={{ background: "#fff", border: "1px solid #dbe2f0", borderRadius: 12, padding: "1rem" }}>
        <h1 style={{ marginTop: 0 }}>{location.name}</h1>
        <p>{location.address}</p>
        <p>{availabilityText(location.availabilityType)}</p>
        <p>
          Bevestigd: {location.confirmCount} | Afgekeurd: {location.denyCount} | Vertrouwensscore:{" "}
          {location.trustScore}
        </p>
        <LocationDetailClient initialLocation={location} />
      </section>
    </main>
  );
}
