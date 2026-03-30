import { createContext, useContext, ReactNode } from 'react';
import {
    ClassRepository,
    EnrollmentRepository,
    ExamRepository,
    TeacherRepository,
    ProfileRepository
} from '../repositories';

/**
 * Repository Context
 * 
 * Provides access to all repositories throughout the application.
 * Use the useRepositories hook to access repositories in components.
 */

interface RepositoryContextType {
    classRepo: ClassRepository;
    enrollmentRepo: EnrollmentRepository;
    examRepo: ExamRepository;
    teacherRepo: TeacherRepository;
    profileRepo: ProfileRepository;
}

// Create singleton instances
const repositories: RepositoryContextType = {
    classRepo: new ClassRepository(),
    enrollmentRepo: new EnrollmentRepository(),
    examRepo: new ExamRepository(),
    teacherRepo: new TeacherRepository(),
    profileRepo: new ProfileRepository()
};

const RepositoryContext = createContext<RepositoryContextType>(repositories);

/**
 * Repository Provider
 * Wrap your app with this provider to enable repository access
 */
export function RepositoryProvider({ children }: { children: ReactNode }) {
    return (
        <RepositoryContext.Provider value={repositories}>
            {children}
        </RepositoryContext.Provider>
    );
}

/**
 * useRepositories Hook
 * 
 * Access repositories in any component:
 * 
 * @example
 * const { classRepo, enrollmentRepo } = useRepositories();
 * const classes = await classRepo.findByTeacherId(teacherId);
 */
export function useRepositories(): RepositoryContextType {
    const context = useContext(RepositoryContext);
    if (!context) {
        throw new Error('useRepositories must be used within a RepositoryProvider');
    }
    return context;
}
