export declare class EnrollmentService {
    private enrollmentRepo;
    private classRepo;
    constructor();
    /**
     * Get all enrollments for a specific student
     */
    getStudentEnrollments(studentId: string): Promise<{
        class: {
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
        } | null;
        id: string;
        is_active: boolean;
        student_id: string;
        class_id: string;
        enrolled_at: Date;
    }[]>;
    /**
     * Enroll a student in a class
     */
    enrollStudent(studentId: string, classId: string): Promise<{
        id: string;
        is_active: boolean;
        student_id: string;
        class_id: string;
        enrolled_at: Date;
    }>;
    /**
     * Remove enrollment
     */
    unenrollStudent(studentId: string, classId: string): Promise<void>;
}
//# sourceMappingURL=enrollmentService.d.ts.map