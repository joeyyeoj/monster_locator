import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function loadDatabaseUrlFromEnvFiles(): string | undefined {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const lines = readFileSync(filePath, "utf8").split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }
      if (!line.startsWith("DATABASE_URL=")) {
        continue;
      }
      return line.slice("DATABASE_URL=".length).trim();
    }
  }
  return undefined;
}

const connectionString = process.env.DATABASE_URL ?? loadDatabaseUrlFromEnvFiles();

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Set it in .env.local, .env, or your shell.");
}

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
