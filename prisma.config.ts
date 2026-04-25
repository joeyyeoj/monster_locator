import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

function readEnvFile(fileName: string): Record<string, string> {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return {};
  }

  const lines = readFileSync(filePath, "utf8").split("\n");
  const parsed: Record<string, string> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    parsed[key] = value;
  }

  return parsed;
}

const envFromFiles = {
  ...readEnvFile(".env"),
  ...readEnvFile(".env.local")
};
const databaseUrl = process.env.DATABASE_URL ?? envFromFiles.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Set it in .env.local or your shell.");
}

export default defineConfig({
  schema: "lib/db/schema.prisma",
  migrations: {
    path: "lib/db/migrations"
  },
  datasource: {
    url: databaseUrl
  }
});
