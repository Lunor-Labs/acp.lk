import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../repositories/schema/index.js';
let _db = null;
let _client = null;
/**
 * Get the Drizzle database instance (singleton).
 * Call this once from your app entry point with the DATABASE_URL.
 */
export function createDrizzleDb(connectionString) {
    if (_db)
        return _db;
    _client = postgres(connectionString, {
        max: 10, // connection pool size
        idle_timeout: 30, // seconds before idle connections are closed
        connect_timeout: 10,
    });
    _db = drizzle(_client, { schema });
    return _db;
}
export function getDb() {
    if (!_db)
        throw new Error('Database not initialized. Call createDrizzleDb() first.');
    return _db;
}
//# sourceMappingURL=drizzle.js.map