import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and set it (see README).",
  );
}

const client = createClient({
  url,
  // Only used when DATABASE_URL points at a hosted libSQL/Turso database.
  // Safe to leave undefined for local file-based development.
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
