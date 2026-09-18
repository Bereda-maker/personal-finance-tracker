import { db } from "./client";
import { categories } from "./schema";

/**
 * Seeds a starter set of categories so the app isn't empty on first run.
 * Safe to re-run: it checks for existing rows first instead of duplicating.
 */
async function seed() {
  const existing = await db.select().from(categories);

  if (existing.length > 0) {
    console.log(`Skipping seed: ${existing.length} categories already exist.`);
    return;
  }

  const starterCategories = [
    { name: "Food", color: "#f97316" },
    { name: "Rent", color: "#6366f1" },
    { name: "Transport", color: "#0ea5e9" },
    { name: "Groceries", color: "#22c55e" },
    { name: "Entertainment", color: "#ec4899" },
    { name: "Utilities", color: "#64748b" },
    { name: "Salary", color: "#16a34a" },
    { name: "Freelance", color: "#84cc16" },
    { name: "Other", color: "#94a3b8" },
  ];

  await db.insert(categories).values(starterCategories);
  console.log(`Seeded ${starterCategories.length} categories.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
