import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// خواندن متغیرهای محیطی از فایل .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL variable is not set in your .env file.");
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