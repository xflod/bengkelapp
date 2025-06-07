
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  let errorMessage = 'Supabase URL and Anon Key must be defined.';
  // Check if running in a Vercel or CI environment
  if (process.env.VERCEL === '1' || process.env.CI === 'true' || process.env.VERCEL_ENV) {
    errorMessage += ' Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly set in your Vercel project environment variables. They are required during the build process and at runtime.';
  } else {
    errorMessage += ' Please ensure they are defined in your .env.local file for local development.';
  }
  throw new Error(errorMessage);
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey);
