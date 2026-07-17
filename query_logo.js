import { getDb } from './src/db/index.js';
import { siteSettings } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const db = getDb();
  const res = await db.select().from(siteSettings).where(eq(siteSettings.key, 'site_logo'));
  console.log('site_logo:', res);
  process.exit(0);
}
main().catch(console.error);
