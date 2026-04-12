import { ClassRepository } from '../repositories/ClassRepository.js';
export declare class CourseService {
    private classRepo;
    constructor();
    /**
     * List all active courses
     */
    listActiveCourses(): Promise<{
        status: string | null;
        id: string;
        is_active: boolean;
        created_at: Date;
        teacher_id: string;
        title: string;
        description: string;
        subject: string;
        schedule: string | null;
        zoom_link: string | null;
        price: string;
        is_free: boolean;
        materials: unknown;
        weeks: unknown;
        next_session_date: string | null;
    }[]>;
    /**
     * List courses by teacher
     */
    listCoursesByTeacher(teacherId: string, onlyActive?: boolean): Promise<{
        status: string | null;
        id: string;
        is_active: boolean;
        created_at: Date;
        teacher_id: string;
        title: string;
        description: string;
        subject: string;
        schedule: string | null;
        zoom_link: string | null;
        price: string;
        is_free: boolean;
        materials: unknown;
        weeks: unknown;
        next_session_date: string | null;
    }[]>;
    /**
     * Get a specific course
     */
    getCourse(classId: string): Promise<{
        status: string | null;
        id: string;
        is_active: boolean;
        created_at: Date;
        teacher_id: string;
        title: string;
        description: string;
        subject: string;
        schedule: string | null;
        zoom_link: string | null;
        price: string;
        is_free: boolean;
        materials: unknown;
        weeks: unknown;
        next_session_date: string | null;
    }>;
    /**
     * Create a new course
     */
    createCourse(data: Parameters<ClassRepository['create']>[0]): Promise<{
        status: string | null;
        id: string;
        is_active: boolean;
        created_at: Date;
        teacher_id: string;
        title: string;
        description: string;
        subject: string;
        schedule: string | null;
        zoom_link: string | null;
        price: string;
        is_free: boolean;
        materials: unknown;
        weeks: unknown;
        next_session_date: string | null;
    }>;
    /**
     * Update course details
     */
    updateCourse(classId: string, updates: Parameters<ClassRepository['update']>[1]): Promise<{
        status: string | null;
        id: string;
        is_active: boolean;
        created_at: Date;
        teacher_id: string;
        title: string;
        description: string;
        subject: string;
        schedule: string | null;
        zoom_link: string | null;
        price: string;
        is_free: boolean;
        materials: unknown;
        weeks: unknown;
        next_session_date: string | null;
    }>;
    /**
     * Soft delete/deactivate a course
     */
    deactivateCourse(classId: string): Promise<void>;
}
//# sourceMappingURL=courseService.d.ts.map