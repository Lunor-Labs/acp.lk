import { BaseRepository } from './BaseRepository.js';
import { Profile, NewProfile } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';
export type UserRole = 'admin' | 'teacher' | 'student';
export type ClassCenter = 'online' | 'riochem' | 'vision';
export declare const CENTER_CODES: Record<ClassCenter, string>;
export declare class ProfileRepository extends BaseRepository {
    constructor(db: DrizzleDb);
    findById(id: string): Promise<Profile | null>;
    findByEmail(email: string): Promise<Profile | null>;
    findByStudentId(studentId: string): Promise<Profile | null>;
    findByRole(role: UserRole): Promise<Profile[]>;
    findActiveByRole(role: UserRole): Promise<Profile[]>;
    create(data: NewProfile): Promise<Profile>;
    update(id: string, data: Partial<NewProfile>): Promise<Profile>;
    toggleActive(id: string, isActive: boolean): Promise<void>;
    countByRole(role: UserRole): Promise<number>;
    generateStudentId(alYear: number, center: ClassCenter): Promise<string>;
}
//# sourceMappingURL=ProfileRepository.d.ts.map