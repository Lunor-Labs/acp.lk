import type { DrizzleDb } from '../providers/db/drizzle.js';
export interface DashboardStats {
    totalPlatformStudents: number;
    totalEnrolledStudents: number;
    newStudentsThisMonth: number;
    totalClasses: number;
    activeClasses: number;
}
export declare class DashboardRepository {
    private readonly db;
    constructor(db: DrizzleDb);
    private getClassIds;
    getStats(teacherId: string): Promise<DashboardStats>;
}
//# sourceMappingURL=DashboardRepository.d.ts.map