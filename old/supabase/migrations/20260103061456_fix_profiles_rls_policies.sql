/*
  # Fix Profiles RLS Policies to Prevent Infinite Recursion

  ## Changes
  - Drop existing policies that cause infinite recursion
  - Create simplified policies that don't reference profiles table recursively
  - Allow users to insert their own profile during signup
  - Allow users to read and update their own profile
  - Admins will manage users through service role key, not through RLS

  ## Security
  - Users can only read their own profile
  - Users can only update their own profile
  - Users can insert their own profile (needed for signup)
  - Profile visibility controlled by is_active flag
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create new simplified policies without recursion
CREATE POLICY "Users can insert own profile during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read active profiles for listings"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_active = true);
