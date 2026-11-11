/*
  # Missing Tables Initial Schema
  
  This migration creates the base tables identified from the codebase analysis
  that were missing from previous migration files.
*/

-- Profiles: Main user records
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text,
  full_name text,
  role text CHECK (role IN ('admin', 'teacher', 'student')),
  is_active boolean DEFAULT true,
  phone text,
  avatar_url text,
  student_number serial,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teachers: Detailed teacher profiles
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subjects text[] DEFAULT '{}',
  visible_on_landing boolean DEFAULT true,
  teacher_number serial,
  created_at timestamptz DEFAULT now()
);

-- Classes: Class management
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text,
  schedule text,
  zoom_link text,
  price numeric DEFAULT 0,
  is_free boolean DEFAULT true,
  is_active boolean DEFAULT true,
  materials jsonb DEFAULT '[]',
  next_session_date timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enrollments: Student-Class relationship
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Class Payments: Tracking payments for individual classes
CREATE TABLE IF NOT EXISTS class_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id),
  class_id uuid REFERENCES classes(id),
  amount numeric NOT NULL,
  payment_status text CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_method text DEFAULT 'payhere',
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Study Packs: Bundled video lessons
CREATE TABLE IF NOT EXISTS study_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text,
  price numeric DEFAULT 0,
  is_free boolean DEFAULT true,
  materials jsonb DEFAULT '[]', -- VideoLesson[]
  file_urls text[] DEFAULT '{}',
  video_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Purchases: Tracking study pack purchases
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id),
  study_pack_id uuid REFERENCES study_packs(id),
  amount numeric,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Exams: Exam metadata
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer,
  total_marks integer,
  questions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Add class_id to exams is handled in 20260103080726_add_exams_improvements.sql
-- But if creating from scratch, it should be here or handled by that migration's ALTER.
-- For safety in this "create missing" script:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE exams ADD COLUMN class_id uuid REFERENCES classes(id);
  END IF;
END $$;

-- Exam Questions: granular questions
CREATE TABLE IF NOT EXISTS exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  question_number integer,
  question_text text,
  options text[],
  correct_answer text,
  marks integer,
  created_at timestamptz DEFAULT now()
);

-- Exam Attempts: Student submissions
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text CHECK (status IN ('started', 'submitted')),
  score integer DEFAULT 0,
  answers jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  rank integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Fee Payments: Overall fee tracking
CREATE TABLE IF NOT EXISTS fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id),
  student_id uuid REFERENCES auth.users(id),
  amount numeric,
  payment_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Platform Config
CREATE TABLE IF NOT EXISTS platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id),
  class_id uuid REFERENCES classes(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Full Test Results
CREATE TABLE IF NOT EXISTS full_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id),
  student_id uuid REFERENCES auth.users(id),
  score numeric,
  total_questions integer,
  correct_answers integer,
  incorrect_answers integer,
  created_at timestamptz DEFAULT now()
);
