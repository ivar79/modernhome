import { getDb } from '../src/db/index.js';
const db = getDb();
async function run() {
  const res = await db.select().from().innerJoin().where().limit(10);
  console.log("Result:", res);
}
run();
