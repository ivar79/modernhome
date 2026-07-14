import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load env variables
dotenv.config({ override: true });

const databaseUrl =
  process.env.modernhome_DATABASE_URL ||
  process.env.modernhome_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Database URL must be set in environment variables.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
});
