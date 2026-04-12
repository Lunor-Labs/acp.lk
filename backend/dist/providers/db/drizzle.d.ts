import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../repositories/schema/index.js';
/**
 * Get the Drizzle database instance (singleton).
 * Call this once from your app entry point with the DATABASE_URL.
 */
export declare function createDrizzleDb(connectionString: string): PostgresJsDatabase<typeof schema>;
export declare function getDb(): PostgresJsDatabase<typeof schema>;
export type DrizzleDb = PostgresJsDatabase<typeof schema>;
//# sourceMappingURL=drizzle.d.ts.map