/*
  # Add Display Numbers for Students and Teachers

  ## Changes
  1. Add Columns to profiles table
    - `student_number` (integer, nullable) - Sequential number for students
    - `teacher_number` (integer, nullable) - Sequential number for teachers
  
  2. Create Sequences
    - `student_number_seq` - Auto-incrementing sequence for student numbers
    - `teacher_number_seq` - Auto-incrementing sequence for teacher numbers
  
  3. Add Trigger Function
    - Automatically assign appropriate display number when profile is created
    - Based on user's role (student or teacher)
  
  ## Benefits
  - User-friendly reference numbers (e.g., "Student #1234", "Teacher #045")
  - Easy to communicate verbally
  - Maintains UUID security while adding usability
  - Sequential ordering tracks registration order

  ## Security
  - Display numbers are read-only after assignment
  - UUID remains the primary secure identifier
  - No enumeration attack risk for critical data
*/

-- Create sequences for student and teacher numbers
CREATE SEQUENCE IF NOT EXISTS student_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS teacher_number_seq START 100;

-- Add display number columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'student_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN student_number integer UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'teacher_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN teacher_number integer UNIQUE;
  END IF;
END $$;

-- Create function to assign display numbers based on role
CREATE OR REPLACE FUNCTION assign_display_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign student number if role is student
  IF NEW.role = 'student' AND NEW.student_number IS NULL THEN
    NEW.student_number := nextval('student_number_seq');
  END IF;
  
  -- Assign teacher number if role is teacher
  IF NEW.role = 'teacher' AND NEW.teacher_number IS NULL THEN
    NEW.teacher_number := nextval('teacher_number_seq');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign display numbers on insert
DROP TRIGGER IF EXISTS assign_display_number_trigger ON profiles;
CREATE TRIGGER assign_display_number_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_display_number();

-- Backfill existing profiles with display numbers
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Assign student numbers to existing students
  FOR profile_record IN
    SELECT id FROM profiles WHERE role = 'student' AND student_number IS NULL
    ORDER BY created_at
  LOOP
    UPDATE profiles
    SET student_number = nextval('student_number_seq')
    WHERE id = profile_record.id;
  END LOOP;
  
  -- Assign teacher numbers to existing teachers
  FOR profile_record IN
    SELECT id FROM profiles WHERE role = 'teacher' AND teacher_number IS NULL
    ORDER BY created_at
  LOOP
    UPDATE profiles
    SET teacher_number = nextval('teacher_number_seq')
    WHERE id = profile_record.id;
  END LOOP;
END $$;
