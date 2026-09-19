# Personal Finance Tracker

A single-user personal finance tracker: record income and expenses, organize
them by category, and see where your money goes on a live dashboard.

No login, no multi-user accounts, no bank syncing — by design. This is a
personal tool for one person, and the architecture reflects that.

## Features

- Record income and expense transactions with amount, category, date, and note
- Create custom categories on the fly, without leaving the transaction form
- Edit and delete transactions (with confirmation on delete)
- Dashboard with: current balance, total income, total expenses
- Spending-by-category breakdown (with percentages, not color alone)
- Six-month spending trend chart
- Recent transactions list with inline edit/delete
- All money handled as integer cents internally — never floating point
- Server-side validation on every write, independent of the client
- Full keyboard navigation and screen-reader-friendly status messages

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | One deployable unit; Server Components read the DB directly with no API round trip, Route Handlers cover mutations |
| Database | SQLite (via libSQL), Turso in production | Zero-ops for a single-user app; libSQL's client works identically against a local file and a hosted database |
| ORM | Drizzle ORM | Typed schema + queries, and file-based migrations that are reviewable in git |
| Validation | Zod | One schema used for both client-side UX feedback and server-side enforcement |
| Testing | Vitest | Fast, TypeScript-native, runs against a real isolated in-memory database |
| Styling | Tailwind CSS | Utility-first, no separate CSS files to keep in sync with components |

## Architecture

```
Browser
  │
  ▼
Next.js App Router
  │
  ├── Server Components (app/page.tsx) ──► lib/calculations.ts ──► Drizzle ──► SQLite
  │     (reads dashboard data directly, no API round trip)
  │
  └── Client Components (forms, buttons) ──► fetch() ──► Route Handlers (app/api/**)
        (mutations only)                          │
                                                    ▼
                                          Zod validation ──► Drizzle ──► SQLite
```

There is no separate backend process. Route Handlers under `app/api/` **are**
the backend — for a single-user, low-traffic app, a second deployed service
would add operational overhead without solving a problem this app actually has.

## Database

Two tables:

**`categories`**
| column | type | notes |
|---|---|---|
| id | integer, PK | |
| name | text | |
| color | text | hex color, e.g. `#22c55e` — used as an accent, never the only signal |

**`transactions`**
| column | type | notes |
|---|---|---|
| id | integer, PK | |
| amount_cents | integer | money as integer cents, never a float |
| type | text | `"income"` \| `"expense"` |
| category_id | integer, FK → categories.id | `ON DELETE RESTRICT` — a category in use can't be deleted |
| occurred_at | integer (unix epoch) | indexed — the dashboard's date-range queries depend on it |
| note | text, nullable | |
| created_at | integer (unix epoch) | |

One category has many transactions. Indexes exist on `transactions.occurred_at`
and `transactions.category_id` for the dashboard's date-range and join queries.

## Local Development

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed      # optional: adds starter categories
npm run dev
```

Open http://localhost:3000.

## Environment Variables

See `.env.example`. In development, `DATABASE_URL` points at a local file
(`file:./db/local.db`). In production it points at a hosted libSQL database
(see Deployment below), and `DATABASE_AUTH_TOKEN` is also required.

Never commit a real `.env` file — it's gitignored, and only `.env.example`
(with placeholder values) is tracked.

## Database Commands

```bash
npm run db:generate   # generate a new SQL migration from db/schema.ts
npm run db:migrate    # apply pending migrations to DATABASE_URL
npm run db:seed       # seed starter categories (safe to re-run)
npm run db:studio     # open Drizzle Studio to browse the database
```

## Testing

```bash
npm test          # run the full suite once
npm run test:watch
```

Tests run against a fresh in-memory SQLite database (see `vitest.config.mts`
and `tests/setup.ts`) — never the real dev database. Coverage focuses on the
business logic the spec calls out explicitly: money formatting/conversion,
Zod validation edge cases, and the SQL-side dashboard aggregations (totals,
category breakdown, monthly trend).

## Git Workflow

`main` is the stable branch. Each milestone was built on a `feature/*` branch
and merged back with `--no-ff`, so the history shows each unit of work:

```
feature/database        → SQLite schema + migrations
feature/categories       → categories/transactions API + dashboard
feature/testing           → Vitest suite
feature/accessibility     → a11y pass
feature/performance        → indexes + bounded API responses
feature/production-prep     → this README, deployment prep
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `test:`, `chore:`, `docs:`, `perf:`).

## Deployment

Target: **Vercel**, with **Turso** as the hosted SQLite-compatible database
(the app talks to it through the same `@libsql/client` used locally — no
driver change between environments).

1. **Create a Turso database** (via the [Turso CLI](https://docs.turso.tech/cli/installation) or dashboard):
   ```bash
   turso db create personal-finance-tracker
   turso db show personal-finance-tracker --url
   turso db tokens create personal-finance-tracker
   ```
2. **Apply migrations against the Turso database** from your machine:
   ```bash
   DATABASE_URL="libsql://<your-db>.turso.io" DATABASE_AUTH_TOKEN="<token>" npm run db:migrate
   ```
3. **Push the repo to GitHub** (already done — see git history) and
   [import it into Vercel](https://vercel.com/new).
4. **Set environment variables in the Vercel project settings**:
   - `DATABASE_URL` = your `libsql://...` URL
   - `DATABASE_AUTH_TOKEN` = the token from step 1
5. **Deploy.** Vercel builds with `npm run build` automatically.
6. **Verify in production**: load the dashboard, add/edit/delete a
   transaction, confirm it persists across a page reload, and check the
   Network tab shows no client-side calls to a database directly (all
   mutations go through `/api/*`).

## Engineering Decisions

**Why a Next.js monolith instead of a separate backend?** This is a
single-user, low-traffic app. A separately deployed Express/Hono/FastAPI
service would mean two things to deploy, two things to keep in sync, and
a network hop for every request — with no corresponding benefit, since
there's no second client, no independent scaling need, and no team boundary
to enforce with a service split.

**Why SQLite (via Turso) instead of Postgres?** The data model is small and
relational but low-volume — one user's transactions, not a multi-tenant
dataset. SQLite (and Turso's hosted flavor of it) is zero-ops: no connection
pool to tune, no separate database server to provision or pay for
per-instance. If this app ever became multi-user, that would be the trigger
to reassess — not before.

**Why Drizzle over an ORM like Prisma?** Drizzle's schema is plain
TypeScript that compiles to real SQL you can read, and its migrations are
files you review in a PR rather than a black-box `.prisma` DSL. For a
learning project, being able to open a migration file and see exactly what
SQL will run mattered more than Prisma's larger ecosystem.

**Why integer cents instead of a decimal/float?** Floats cannot represent
values like `$0.10` exactly in binary — summing enough of them silently
drifts. Storing money as an integer number of cents makes every calculation
exact; conversion to a human "dollars" string happens only at the UI
boundary (`lib/money.ts`).

## Future Improvements

The following were considered and intentionally deferred — see the
project brief's Milestone 12 for the full list:

1. Recurring transactions
2. CSV export
3. Monthly budgets with over/under indicators
4. Offline support
5. A separate Hono API, as an explicit experiment in comparing it against
   Next.js Route Handlers for this workload (trade-offs to evaluate: extra
   deploy target and network hop vs. independent scaling/language freedom —
   for this app's actual traffic, the Route Handler approach wins on
   simplicity with no real downside)
