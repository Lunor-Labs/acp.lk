/*
  # Gallery, Reviews, Test Results Schema
  
  Adds:
  - gallery_images: teacher-managed gallery photos
  - class_reviews: student review messages collected in-class
  - test_results: student test scores uploaded via CSV (top 10 shown on landing)
*/

-- Gallery Images
CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  caption text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Class Reviews (collected in-class by teacher)
CREATE TABLE IF NOT EXISTS class_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  review_text text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  student_image_url text,
  is_visible boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Test Results (uploaded via CSV)
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  test_date date NOT NULL,
  student_name text NOT NULL,
  school text,
  marks numeric NOT NULL,
  rank integer,
  student_image_url text,
  year_label text,  -- e.g. "2026 A/L Physics"
  created_at timestamptz DEFAULT now()
);

-- RLS Policies for gallery_images
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_images_public_read" ON gallery_images
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "gallery_images_teacher_manage" ON gallery_images
  FOR ALL TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for class_reviews
ALTER TABLE class_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_reviews_public_read" ON class_reviews
  FOR SELECT TO public USING (is_visible = true);

CREATE POLICY "class_reviews_teacher_manage" ON class_reviews
  FOR ALL TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for test_results
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_results_public_read" ON test_results
  FOR SELECT TO public USING (true);

CREATE POLICY "test_results_teacher_manage" ON test_results
  FOR ALL TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );
