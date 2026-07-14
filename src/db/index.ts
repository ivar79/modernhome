import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config({ override: true });

const { Pool } = pg;
let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    try {
      const databaseUrl =
        process.env.modernhome_DATABASE_URL ||
        process.env.modernhome_POSTGRES_URL ||
        process.env.POSTGRES_URL ||
        process.env.NEON_DATABASE_URL ||
        process.env.DATABASE_URL;

      let pool;
      if (databaseUrl) {
        pool = new Pool({
          connectionString: databaseUrl,
          ssl:
            databaseUrl.includes("neon.tech") || databaseUrl.includes("sslmode=")
              ? { rejectUnauthorized: false }
              : undefined,
        });
      } else {
        const host = process.env.SQL_HOST;
        const database = process.env.SQL_DB_NAME;
        const user = process.env.SQL_ADMIN_USER;
        const password = process.env.SQL_ADMIN_PASSWORD;

        if (!host || !database || !user || !password) {
          throw new Error(
            "Database configuration environment variables are missing."
          );
        }

        pool = new Pool({
          host,
          database,
          user,
          password,
          port: 5432,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });
      }

      dbInstance = drizzle(pool, { schema });
    } catch (e) {
      console.warn('[AI Studio] Database not connected — using mock');
      const noOp = {
        findMany: async () => [],
        findFirst: async () => null,
        findUnique: async () => null,
        create: async (d: any) => d?.data ?? {},
        update: async (d: any) => d?.data ?? {},
        delete: async () => ({}),
      };
      dbInstance = new Proxy({}, {
        get: (_, prop) => {
          const chainable: any = () => new Proxy({}, {
            get: (_, innerProp) => {
              if (innerProp === 'then') {
                return (resolve: any) => resolve([]);
              }
              return chainable;
            }
          });
          
          if (prop === 'query') return new Proxy({}, { get: () => noOp });
          if (prop === 'insert') return () => ({ values: chainable, onConflictDoUpdate: chainable });
          if (prop === 'select') return chainable;
          if (prop === 'update') return () => ({ set: chainable });
          if (prop === 'delete') return () => ({ where: chainable });
          return chainable;
        }
      });
    }
  }
  return dbInstance;
}
