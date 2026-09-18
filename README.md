# Personal Finance Tracker

A single-user personal finance tracker built with Next.js, TypeScript, SQLite, and Drizzle ORM.

> **Status:** Project setup + database layer (Milestone 2). Features, architecture
> notes, and full documentation will be filled in as each milestone lands.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Tech Stack

- Next.js (App Router) + TypeScript
- SQLite + Drizzle ORM
- Zod for validation
- Vitest for testing
- Tailwind CSS for styling

## Database Commands

```bash
npm run db:generate   # generate a new SQL migration from db/schema.ts
npm run db:migrate    # apply pending migrations to DATABASE_URL
npm run db:seed       # seed starter categories (safe to re-run)
npm run db:studio     # open Drizzle Studio to browse the database
```

Local setup:

```bash
cp .env.example .env
npm run db:migrate
npm run db:seed
```
