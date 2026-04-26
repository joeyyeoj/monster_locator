# Waar kan ik een monstertje halen? 🧊🥤

Een [Next.js](https://nextjs.org/)-app voor de échte vragen in het leven: **waar in de buurt krijg ik mijn (suikervrije) Monster fix?** Geen mysterieuze energy-drank, maar wel een duidelijke kaart, winkels in je omgeving, en community-weetjes over gekoeld versus kamertemperatuur.

## Wat doet die?

- **Kaart + jouw locatie** — toestemming gegeven? Dan draait de kaart mee, niet alleen de pin. Geen toestemming? Dan toont ie braaf Utrecht of waar je anders in belandt.
- **Dichtstbijzijnde winkels** binnen X kilometer (jij kiest de straal, het leven is al ingewikkeld genoeg).
- **Vertrouwen, stemmen, temperatuur** — *Klopt* / *Klopt niet* voor of een plek echt monster verkoopt, plus stem op koud / winkel / beide. Cijfertjes erbij, want statistieken maken alles feestelijker.
- **Foto’s** — zie met eigen ogen of het schap er bemoedigend uitziet. Uploaden mag, binnen de grenzen van fatsoen, JPEG, PNG, WebP en 4 MB.

## Stack (kort, voor op feestjes)

- **Next.js** (App Router) · **React** · **TypeScript** — omdat we al genoeg chaos in het hoofd hebben.
- **Prisma** + **PostgreSQL** — geen Excel-sheet met adressen.
- **Leaflet** + **OpenStreetMap** — kaarten zonder poespas.
- **Vercel Blob** — opslag voor al die sfeerfoto’s van gekoelde blikken.

## Lokaal draaien

1. **Node** — redelijk recent, je kent de drill.

2. **Kloon, installeer:**

   ```bash
   npm install
   ```

3. **Postgres** — `DATABASE_URL` in `.env` of `.env.local` (zie `.env.example`). Daarna:

   ```bash
   npx prisma migrate deploy --schema lib/db/schema.prisma
   npx prisma generate --schema lib/db/schema.prisma
   ```

4. **Optioneel: blob-token** — wil je upload testen, zet `BLOB_READ_WRITE_TOKEN` (Vercel Blob read-write) in je env.

5. **Dev server** — standaard op **poort 3082**:

   ```bash
   npm run dev
   ```

6. **Lint** wanneer je de architectuur niet vertrouwt:

   ```bash
   npm run lint
   ```

7. **Build** wanneer je echt klaar bent (of denkt klaar te zijn):

   ```bash
   npm run build
   ```

## Projectnaam in `package.json`

Hij heet nog steeds `monster-locator` — klinkt als iets met radar; dat is *ongeveer* de sfeer.

## Juridische hoeken

Geen suiker in het blik, ook geen adviesrechten in dit document. *Monster Energy drink* is een merk van derden; deze app is een hobby-/community-achtig project, geen officieel iets.

---

*Veel plezier met winkels vinden. Mocht je ooit in een supermarkt staan zonder Monster: je bent niet de eerste. Drink verantwoord — water bestaat óók.*
