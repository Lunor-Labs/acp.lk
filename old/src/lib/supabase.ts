/**
 * Supabase Client (Legacy)
 * 
 * This file is maintained for backward compatibility.
 * New code should use the database abstraction layer from './database'
 * 
 * Migration path:
 * - Old: import { supabase } from './lib/supabase'
 * - New: import { db } from './lib/database'
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmkrvgyjmtvcxatlashi.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJta3J2Z3lqbXR2Y3hhdGxhc2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODQzMjksImV4cCI6MjA4NjY2MDMyOX0.V9akkQdVc8b_BuopM8IapM2WH61_2gUqTSM4aG4bOpU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Legacy export - still works with existing code
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-export database abstraction for new code
export { db } from './database';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
