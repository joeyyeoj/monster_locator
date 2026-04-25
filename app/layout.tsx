import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monster Finder NL",
  description: "Vind de dichtstbijzijnde winkel met suikervrije Monster Energy."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
