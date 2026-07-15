import { getDb } from "./src/db/index.ts";
import { siteSettings } from "./src/db/schema.ts";

async function run() {
  const db = getDb();
  const rows = await db.select().from(siteSettings);
  console.log(rows);
}
run();
