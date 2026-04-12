import { env } from './src/config/env.js';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

async function test() {
  console.log('Testing DB connection to:', env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  try {
    const client = postgres(env.DATABASE_URL, { max: 1, connect_timeout: 5 });
    const result = await client`SELECT 1 as "result"`;
    console.log('DB Connection OK:', result);
  } catch (err: any) {
    console.error('DB Connection Failed:', err.message);
  }

  console.log('\nTesting Supabase Auth to:', env.SUPABASE_URL);
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    console.log('Supabase Auth OK! Users count:', data.users.length);
  } catch (err: any) {
    console.error('Supabase Auth Failed:', err.message);
  }
  process.exit(0);
}

test();
