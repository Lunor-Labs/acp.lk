-- Add payslip columns to class_payments
ALTER TABLE class_payments
  ADD COLUMN IF NOT EXISTS slip_image_url text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Widen payment_status to include 'rejected'
-- (constraint was created inline so postgres auto-names it)
DO $$
BEGIN
  ALTER TABLE class_payments
    DROP CONSTRAINT IF EXISTS class_payments_payment_status_check;
  ALTER TABLE class_payments
    ADD CONSTRAINT class_payments_payment_status_check
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'rejected'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update payment_status constraint: %', SQLERRM;
END $$;
