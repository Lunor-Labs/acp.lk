/*
  # Add Exams System Improvements

  1. Changes to exams table
    - Add class_id foreign key to link exams to classes
    - Add questions jsonb field to store MCQ questions directly

  2. Changes to exam_attempts table
    - Add rank column to track student rankings

  3. Changes to study_packs table
    - Add file_urls and video_urls arrays for easier access to materials
*/

-- Add class_id to exams if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE exams ADD COLUMN class_id uuid REFERENCES classes(id);
  END IF;
END $$;

-- Add questions to exams if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'questions'
  ) THEN
    ALTER TABLE exams ADD COLUMN questions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add rank to exam_attempts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_attempts' AND column_name = 'rank'
  ) THEN
    ALTER TABLE exam_attempts ADD COLUMN rank integer DEFAULT 0;
  END IF;
END $$;

-- Add file_urls to study_packs if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_packs' AND column_name = 'file_urls'
  ) THEN
    ALTER TABLE study_packs ADD COLUMN file_urls text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Add video_urls to study_packs if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_packs' AND column_name = 'video_urls'
  ) THEN
    ALTER TABLE study_packs ADD COLUMN video_urls text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;
