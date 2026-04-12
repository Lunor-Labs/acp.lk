import { BaseRepository } from './BaseRepository.js';
import { Teacher, NewTeacher } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';
export declare class TeacherRepository extends BaseRepository {
    constructor(db: DrizzleDb);
    findById(id: string): Promise<Teacher | null>;
    findByProfileId(profileId: string): Promise<Teacher | null>;
    findVisible(): Promise<Teacher[]>;
    findAll(): Promise<Teacher[]>;
    create(data: NewTeacher): Promise<Teacher>;
    update(id: string, data: Partial<NewTeacher>): Promise<Teacher>;
    toggleVisibility(teacherId: string, visible: boolean): Promise<void>;
}
//# sourceMappingURL=TeacherRepository.d.ts.map