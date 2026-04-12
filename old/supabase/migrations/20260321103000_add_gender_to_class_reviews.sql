-- Add gender column to class_reviews table
-- This enables selecting a gender-specific default avatar when no photo is provided

ALTER TABLE class_reviews
    ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

COMMENT ON COLUMN class_reviews.gender IS 'Gender of the student — used to display a default avatar when no image URL is set. Values: male | female | NULL';
