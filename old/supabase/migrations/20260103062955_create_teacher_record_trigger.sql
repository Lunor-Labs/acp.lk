/*
  # Auto-create Teacher Record Trigger

  ## Purpose
  Automatically create a teacher record in the teachers table when a new profile
  with role 'teacher' is created. This ensures teachers can immediately start
  creating classes without manual teacher record creation.

  ## Changes
  1. Create Function
    - `create_teacher_record()` - Automatically creates teacher record for new teacher profiles
  
  2. Create Trigger
    - Fires after INSERT on profiles table
    - Only executes for profiles with role = 'teacher'
    - Creates corresponding entry in teachers table

  ## Benefits
  - Seamless teacher onboarding
  - No manual intervention required
  - Teachers can start creating classes immediately after registration
*/

-- Create function to auto-create teacher record
CREATE OR REPLACE FUNCTION create_teacher_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create teacher record if role is teacher
  IF NEW.role = 'teacher' THEN
    INSERT INTO teachers (profile_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create teacher record
DROP TRIGGER IF EXISTS create_teacher_record_trigger ON profiles;
CREATE TRIGGER create_teacher_record_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_record();

-- Backfill existing teacher profiles
INSERT INTO teachers (profile_id)
SELECT id FROM profiles 
WHERE role = 'teacher' 
AND id NOT IN (SELECT profile_id FROM teachers)
ON CONFLICT DO NOTHING;
