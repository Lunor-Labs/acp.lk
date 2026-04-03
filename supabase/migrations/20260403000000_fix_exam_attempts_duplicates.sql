/*
  # Fix exam_attempts duplicate records

  The exam_attempts table had no unique constraint on (exam_id, student_id),
  which allowed multiple rows per student per exam due to race conditions
  (two browser tabs, timer auto-submit firing alongside manual submit, etc.)

  This migration:
  1. Deduplicates existing rows — keeps the best row per (exam_id, student_id):
     - Prefers 'submitted' over 'started'
     - Among submitted rows, keeps the one with the highest score
     - Deletes all other duplicates
  2. Adds a UNIQUE constraint on (exam_id, student_id) to prevent future duplicates
*/

-- Step 1: Delete duplicate rows, keeping the "best" attempt per student per exam
DELETE FROM exam_attempts
WHERE id NOT IN (
  SELECT DISTINCT ON (exam_id, student_id) id
  FROM exam_attempts
  ORDER BY
    exam_id,
    student_id,
    -- Prefer 'submitted' rows over 'started'
    CASE WHEN status = 'submitted' THEN 0 ELSE 1 END ASC,
    -- Among submitted rows, prefer the highest score
    score DESC,
    -- Fallback: keep the most recent
    started_at DESC
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE exam_attempts
  ADD CONSTRAINT unique_exam_attempt_per_student
  UNIQUE (exam_id, student_id);
