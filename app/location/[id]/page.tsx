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
      url: path,
      ...(location.photoUrl
        ? { images: [{ url: location.photoUrl, alt: `${location.name} — foto` }] }
        : {})
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
    <main className="ios-page-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="ios-backlink">
        ← Terug
      </Link>
      <section className="ios-card" style={{ padding: "1.1rem" }}>
        <h1 className="ios-text-title" style={{ fontSize: "1.25rem", marginTop: 0, marginBottom: "0.5rem" }}>
          {location.name}
        </h1>
        <p className="ios-text-body" style={{ fontSize: "0.95rem" }}>
          {location.address}
        </p>
        <p className="ios-text-footnote">{availabilityText(location.availabilityType)}</p>
        <p className="ios-text-footnote">
          Bevestigd: {location.confirmCount} · Afgekeurd: {location.denyCount} · Vertrouwensscore:{" "}
          {location.trustScore}
        </p>
        <LocationDetailClient initialLocation={location} />
      </section>
    </main>
  );
}
