import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kefkanjpftswuqabxdgx.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZmthbmpwZnRzd3VxYWJ4ZGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MTI4OTgsImV4cCI6MjA4Mjk4ODg5OH0.Wke6exv4ccanKhq8ZpW2fjD-_-BruM6dco_T7qCUJbY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
