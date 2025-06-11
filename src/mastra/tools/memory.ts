import { Memory } from "@mastra/memory";
import { PgVector, PostgresStore } from "@mastra/pg";

const host = process.env.SUPABASE_DB_HOST || "";
const port = (process.env.SUPABASE_DB_PORT || 0) as number;
const user = process.env.SUPABASE_DB_USER || "";
const database = process.env.SUPABASE_DB_NAME || "";
const password = process.env.SUPABASE_DB_PASSWORD || "";
const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;

export const memory = new Memory({
  storage: new PostgresStore({
    host,
    port,
    user,
    database,
    password,
  }),
  vector: new PgVector({ connectionString }),
  options: {
    lastMessages: 50,
  },
});
