import { eq, and } from 'drizzle-orm';
import type { DrizzleDb } from '../providers/db/drizzle.js';

/**
 * Base Repository (Drizzle-based)
 *
 * Provides common CRUD patterns via Drizzle ORM.
 * Subclasses extend this and add domain-specific queries.
 *
 * Unlike the frontend BaseRepository, this takes the Drizzle table object
 * directly — keeping it fully type-safe without any raw string queries.
 */
export abstract class BaseRepository {
  constructor(protected readonly db: DrizzleDb) {}
}
