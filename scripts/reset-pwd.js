const { drizzle } = require("drizzle-orm/node-postgres");
const { pgTable, text } = require("drizzle-orm/pg-core");
const { eq } = require("drizzle-orm");
const pg = require("pg");
const bcryptjs = require("bcryptjs");

const admins = pgTable('admins', {
  id: text('id').primaryKey(),
  username: text('username'),
  password: text('password'),
});

async function main() {
  const url = process.env.DATABASE_URL || process.env.modernhome_DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("No DB URL");
  
  const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const db = drizzle(pool);
  
  const hashedPassword = await bcryptjs.hash("admin123", 10);
  await db.update(admins).set({ password: hashedPassword }).where(eq(admins.username, "admin"));
  
  console.log("Password reset to admin123");
  process.exit(0);
}
main();
