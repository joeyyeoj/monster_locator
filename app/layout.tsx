import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Monster Finder NL",
    template: "%s | Monster Finder NL"
  },
  description: "Vind de dichtstbijzijnde winkel met suikervrije Monster Energy.",
  applicationName: "Monster Finder NL",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: siteUrl,
    title: "Monster Finder NL",
    description: "Vind de dichtstbijzijnde winkel met suikervrije Monster Energy.",
    siteName: "Monster Finder NL"
  },
  twitter: {
    card: "summary_large_image",
    title: "Monster Finder NL",
    description: "Vind de dichtstbijzijnde winkel met suikervrije Monster Energy."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
