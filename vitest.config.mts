import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // Every test run gets a brand-new in-memory SQLite database — never
    // the real dev database (db/local.db). See tests/setup.ts.
    env: {
      DATABASE_URL: ":memory:",
    },
    setupFiles: ["./tests/setup.ts"],
  },
});
