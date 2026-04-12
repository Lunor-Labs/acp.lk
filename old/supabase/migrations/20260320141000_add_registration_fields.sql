/*
  # Add mandatory registration fields to profiles

  ## Changes
  1. Add columns to profiles table:
    - `nic` (text, nullable) - National Identity Card number
    - `whatsapp_no` (text, nullable) - WhatsApp contact number
    - `mobile_no` (text, nullable) - Primary mobile contact number
*/

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nic text,
ADD COLUMN IF NOT EXISTS whatsapp_no text,
ADD COLUMN IF NOT EXISTS mobile_no text;

-- Optional: Update existing phone column if needed, 
-- but we'll keep it for compatibility and use mobile_no as the primary one for new registrations.
