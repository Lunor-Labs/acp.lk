# Repository Layer - Usage Guide

## Overview

The repository layer provides a clean abstraction for database operations. Each repository handles a specific domain (Classes, Enrollments, Exams, etc.) and provides type-safe methods for common operations.

---

## Available Repositories

### ClassRepository
Manages class operations:
- `findByTeacherId(teacherId)` - Get all classes for a teacher
- `findActiveClasses()` - Get all active classes
- `findBySubject(subject)` - Find classes by subject
- `toggleActive(classId, isActive)` - Toggle class status
- `search(query)` - Search classes by title/subject

### EnrollmentRepository
Manages student enrollments:
- `findByStudentId(studentId)` - Get student's enrollments
- `findByClassId(classId)` - Get class enrollments
- `getEnrollmentCount(classId)` - Count enrollments for a class
- `isEnrolled(studentId, classId)` - Check enrollment status
- `enroll(studentId, classId)` - Enroll a student
- `unenroll(studentId, classId)` - Unenroll a student

### ExamRepository
Manages exams and attempts:
- `findByTeacherId(teacherId)` - Get teacher's exams
- `findUpcoming()` - Get upcoming exams
- `findActive()` - Get currently running exams
- `getQuestions(examId)` - Get exam questions
- `createWithQuestions(exam, questions)` - Create exam with questions
- `getSubmissionCount(examId)` - Count submissions

### TeacherRepository
Manages teacher profiles:
- `findByProfileId(profileId)` - Get teacher by profile
- `findVisible()` - Get teachers visible on landing page
- `findBySubject(subject)` - Find teachers by subject
- `getStatistics(teacherId)` - Get teacher stats

### ProfileRepository
Manages user profiles:
- `findByEmail(email)` - Find profile by email
- `findByRole(role)` - Get profiles by role
- `findActive()` - Get active profiles
- `search(query)` - Search by name/email
- `updateRole(profileId, role)` - Update user role

---

## Usage Examples

### Option 1: Direct Import (Simple)

```typescript
import { ClassRepository } from '../repositories';

const classRepo = new ClassRepository();
const classes = await classRepo.findByTeacherId(teacherId);
```

### Option 2: Using Context (Recommended)

```typescript
import { useRepositories } from '../contexts/RepositoryContext';

function MyComponent() {
  const { classRepo, enrollmentRepo } = useRepositories();
  
  const loadData = async () => {
    const classes = await classRepo.findByTeacherId(teacherId);
    const count = await enrollmentRepo.getEnrollmentCount(classId);
  };
}
```

---

## Migration Example

### Before (Direct Database Access)
```typescript
const { data, error } = await supabase
  .from('classes')
  .select('*')
  .eq('teacher_id', teacherId)
  .order('created_at', { ascending: false });

if (error) throw error;
setClasses(data || []);
```

### After (Using Repository)
```typescript
const { classRepo } = useRepositories();
const classes = await classRepo.findByTeacherId(teacherId);
setClasses(classes);
```

---

## Benefits

✅ **Type Safety** - Full TypeScript support
✅ **Reusability** - Common queries in one place
✅ **Testability** - Easy to mock for tests
✅ **Maintainability** - Changes in one location
✅ **Consistency** - Same patterns across the app
