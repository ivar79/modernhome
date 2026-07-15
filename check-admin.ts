import { getDb } from "./src/db/index.ts";
import { admins } from "./src/db/schema.ts";
import bcrypt from "bcryptjs";

async function run() {
  const db = getDb();
  const rows = await db.select().from(admins);
  console.log("Admins:", rows);
  
  if (rows.length > 0) {
    const match = await bcrypt.compare("admin123", rows[0].password);
    console.log("Password match for admin123:", match);
  }
}
run();
