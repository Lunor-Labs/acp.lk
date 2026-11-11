import { eq, and, ilike } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { profiles, Profile, NewProfile } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export type UserRole = 'admin' | 'teacher' | 'student';
export type ClassCenter = 'online' | 'riochem' | 'vision';

export const CENTER_CODES: Record<ClassCenter, string> = {
  online: '0',
  riochem: '1',
  vision: '2',
};

export class ProfileRepository extends BaseRepository {
  constructor(db: DrizzleDb) {
    super(db);
  }

  async findById(id: string): Promise<Profile | null> {
    const result = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const result = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    return result[0] ?? null;
  }

  async findByStudentId(studentId: string): Promise<Profile | null> {
    const result = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.student_id as any, studentId))
      .limit(1);
    return result[0] ?? null;
  }

  async findByRole(role: UserRole): Promise<Profile[]> {
    return this.db
      .select()
      .from(profiles)
      .where(eq(profiles.role, role));
  }

  async findActiveByRole(role: UserRole): Promise<Profile[]> {
    return this.db
      .select()
      .from(profiles)
      .where(and(eq(profiles.role, role), eq(profiles.is_active, true)));
  }

  async create(data: NewProfile): Promise<Profile> {
    const result = await this.db
      .insert(profiles)
      .values(data)
      .returning();
    if (!result[0]) throw new Error('Failed to create profile');
    return result[0];
  }

  async update(id: string, data: Partial<NewProfile>): Promise<Profile> {
    const result = await this.db
      .update(profiles)
      .set({ ...data, updated_at: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    if (!result[0]) throw new Error('Profile not found');
    return result[0];
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.db
      .update(profiles)
      .set({ is_active: isActive, updated_at: new Date() })
      .where(eq(profiles.id, id));
  }

  async countByRole(role: UserRole): Promise<number> {
    const result = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.role, role));
    return result.length;
  }

  async generateStudentId(alYear: number, center: ClassCenter): Promise<string> {
    const yy = String(alYear).slice(-2);
    const c = CENTER_CODES[center];
    const prefix = `${yy}${c}`;

    const existing = await this.db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.al_year as any, alYear),
          eq(profiles.center as any, center)
        )
      );

    const count = existing.length;
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }
}
