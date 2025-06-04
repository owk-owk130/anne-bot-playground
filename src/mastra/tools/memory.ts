import { Memory } from "@mastra/memory";
import { PgVector, PostgresStore } from "@mastra/pg";

const host = process.env.SUPABASE_DB_HOST;
const port = process.env.SUPABASE_DB_PORT
  ? Number.parseInt(process.env.SUPABASE_DB_PORT, 10)
  : undefined;
const user = process.env.SUPABASE_DB_USER;
const database = process.env.SUPABASE_DB_DB_NAME;
const password = process.env.SUPABASE_DB_PASSWORD;

const hasPostgresConfig = host && port && user && database && password;

export const storage = hasPostgresConfig
  ? new PostgresStore({
      host: host as string,
      port: port as number,
      user: user as string,
      database: database as string,
      password: password as string
    })
  : undefined;

const vector = hasPostgresConfig
  ? new PgVector({
      connectionString: `postgresql://${user}:${password}@${host}:${port}/${database}`
    })
  : undefined;

export const memory = new Memory({
  storage,
  vector,
  options: {
    lastMessages: 10,
    semanticRecall: false,
    threads: {
      generateTitle: false
    }
  }
});
