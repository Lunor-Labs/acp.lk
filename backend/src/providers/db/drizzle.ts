import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { env } from '../../config/env.js';
import * as schema from '../../repositories/schema/index.js';

// Initialize immediately since process env is already loaded
const _client = postgres(env.DATABASE_URL, {
  max: 10,           // connection pool size
  idle_timeout: 30,  // seconds before idle connections are closed
  connect_timeout: 10,
});

const _db = drizzle(_client, { schema });

export function getDb(): PostgresJsDatabase<typeof schema> {
  return _db;
}

export type DrizzleDb = PostgresJsDatabase<typeof schema>;
