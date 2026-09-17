import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

// Plain Postgres for now (see docs/01-system-design.md §9). DATABASE_URL
// points at the docker-compose Postgres by default; swapping to a Supabase
// project later is just pointing this at its connection string and
// re-running db/schema.sql against it.
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://c04:c04@localhost:5433/c04";

const g = globalThis as unknown as { __c04Pool?: Pool; __c04SchemaReady?: Promise<void> };

export function getPool(): Pool {
  if (!g.__c04Pool) {
    g.__c04Pool = new Pool({ connectionString: DATABASE_URL });
  }
  return g.__c04Pool;
}

export async function ensureSchema(): Promise<void> {
  if (!g.__c04SchemaReady) {
    g.__c04SchemaReady = (async () => {
      const schemaPath = path.join(process.cwd(), "..", "db", "schema.sql");
      const sql = fs.readFileSync(schemaPath, "utf-8");
      await getPool().query(sql);
    })();
  }
  return g.__c04SchemaReady;
}

export async function nextId(prefix: string): Promise<string> {
  await ensureSchema();
  const res = await getPool().query<{ value: number }>(
    `insert into counters (key, value) values ($1, 1)
     on conflict (key) do update set value = counters.value + 1
     returning value`,
    [prefix]
  );
  return `${prefix}-${res.rows[0].value}`;
}
