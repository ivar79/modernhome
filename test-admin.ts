import { getDb } from "./src/db/index.ts";
import { admins } from "./src/db/schema.ts";

async function run() {
  const db = getDb();
  const rows = await db.select().from(admins);
  console.log(rows);
}
run();
