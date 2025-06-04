import { Memory } from "@mastra/memory";
import { PgVector, PostgresStore } from "@mastra/pg";

const host = process.env.POSTGRES_HOST || "";
const port = (process.env.POSTGRES_PORT || 0) as number;
const user = process.env.POSTGRES_USER || "";
const database = process.env.POSTGRES_DB_NAME || "";
const password = process.env.POSTGRES_PASSWORD || "";
const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;

export const memory = new Memory({
  storage: new PostgresStore({
    host,
    port,
    user,
    database,
    password
  }),
  vector: new PgVector({ connectionString }),
  options: {
    lastMessages: 10,
    semanticRecall: false,
    threads: {
      generateTitle: false
    }
  }
});
