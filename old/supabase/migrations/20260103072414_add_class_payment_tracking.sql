/*
  # Add Class Payment and Session Tracking

  1. New Columns
    - `classes.next_session_date` (timestamptz) - Stores the next scheduled class session
    - `classes.status` (text) - Tracks if class is 'active' or 'completed'
    
  2. New Table
    - `class_payments`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references profiles)
      - `class_id` (uuid, references classes)
      - `amount` (numeric)
      - `payment_status` (text) - 'pending', 'completed', 'failed'
      - `payment_method` (text) - 'payhere', 'cash', etc.
      - `payment_reference` (text) - PayHere order ID or reference
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on `class_payments` table
    - Add policies for students to view their own payments
    - Add policies for teachers/admins to manage payments
*/

-- Add new columns to classes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'next_session_date'
  ) THEN
    ALTER TABLE classes ADD COLUMN next_session_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'status'
  ) THEN
    ALTER TABLE classes ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'completed'));
  END IF;
END $$;

-- Create class_payments table
CREATE TABLE IF NOT EXISTS class_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) NOT NULL,
  class_id uuid REFERENCES classes(id) NOT NULL,
  amount numeric NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_method text DEFAULT 'payhere',
  payment_reference text DEFAULT '',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE class_payments ENABLE ROW LEVEL SECURITY;

-- Students can view their own payments
CREATE POLICY "Students can view own payments"
  ON class_payments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can insert their own payment records
CREATE POLICY "Students can create own payments"
  ON class_payments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can update their own pending payments
CREATE POLICY "Students can update own pending payments"
  ON class_payments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND payment_status = 'pending')
  WITH CHECK (student_id = auth.uid());

-- Teachers can view payments for their classes
CREATE POLICY "Teachers can view class payments"
  ON class_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes
      JOIN teachers ON classes.teacher_id = teachers.id
      WHERE classes.id = class_payments.class_id
      AND teachers.profile_id = auth.uid()
    )
  );

-- Teachers can manage payments for their classes
CREATE POLICY "Teachers can manage class payments"
  ON class_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes
      JOIN teachers ON classes.teacher_id = teachers.id
      WHERE classes.id = class_payments.class_id
      AND teachers.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      JOIN teachers ON classes.teacher_id = teachers.id
      WHERE classes.id = class_payments.class_id
      AND teachers.profile_id = auth.uid()
    )
  );

-- Admins can view and manage all payments
CREATE POLICY "Admins can manage all payments"
  ON class_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );