import { BaseRepository } from './BaseRepository.js';
import { Class, NewClass } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';
export declare class ClassRepository extends BaseRepository {
    constructor(db: DrizzleDb);
    findAll(): Promise<Class[]>;
    findById(id: string): Promise<Class | null>;
    findByTeacherId(teacherId: string): Promise<Class[]>;
    findActiveClasses(): Promise<Class[]>;
    findActiveByTeacherId(teacherId: string): Promise<Class[]>;
    create(data: NewClass): Promise<Class>;
    update(id: string, data: Partial<NewClass>): Promise<Class>;
    toggleActive(classId: string, isActive: boolean): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=ClassRepository.d.ts.map