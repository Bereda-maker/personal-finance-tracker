import { sql } from "drizzle-orm";
import {
  sqliteTable,
  integer,
  text,
  index,
} from "drizzle-orm/sqlite-core";

/**
 * A user-defined spending/income category (e.g. "Food", "Salary").
 * Every transaction belongs to exactly one category.
 */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // Hex color, e.g. "#22c55e". Used as a visual accent — never the sole
  // way information is communicated (see accessibility requirements).
  color: text("color").notNull(),
});

/**
 * A single income or expense entry.
 *
 * Money is stored as integer cents (amountCents), never as a float.
 * See lib/money.ts for the conversion utilities used at the UI boundary.
 */
export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    amountCents: integer("amount_cents").notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    // Stored as a real SQLite date (unix epoch under the hood), so date-range
    // queries (e.g. "this month", "last 6 months") can be done in SQL rather
    // than pulling every row into JavaScript.
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    // The dashboard's six-month trend and recent-transactions queries both
    // sort/filter on occurredAt; the category breakdown joins on categoryId.
    // Without these, both scale linearly with total transaction count.
    index("transactions_occurred_at_idx").on(table.occurredAt),
    index("transactions_category_id_idx").on(table.categoryId),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
