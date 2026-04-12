import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../repositories/schema/index.js';

let _db: PostgresJsDatabase<typeof schema> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

/**
 * Get the Drizzle database instance (singleton).
 * Call this once from your app entry point with the DATABASE_URL.
 */
export function createDrizzleDb(connectionString: string): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;

  _client = postgres(connectionString, {
    max: 10,           // connection pool size
    idle_timeout: 30,  // seconds before idle connections are closed
    connect_timeout: 10,
  });

  _db = drizzle(_client, { schema });
  return _db;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) throw new Error('Database not initialized. Call createDrizzleDb() first.');
  return _db;
}

export type DrizzleDb = PostgresJsDatabase<typeof schema>;
