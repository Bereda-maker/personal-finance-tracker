import { beforeAll, beforeEach } from "vitest";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "@/db/client";
import { categories, transactions } from "@/db/schema";

// Applies the same migrations used in dev/production, so tests run against
// the real schema — not a hand-maintained duplicate of it.
beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./db/migrations" });
});

// Every test starts from a clean slate so tests can't affect each other.
beforeEach(async () => {
  await db.delete(transactions);
  await db.delete(categories);
});
