
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types'; // Akan kita buat nanti atau Supabase bisa generate

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env.local');
}

// Tip: Gunakan Database type dari Supabase CLI untuk type safety yang lebih baik
// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
// Untuk sekarang, kita gunakan any karena database.types.ts belum ada
export const supabase: SupabaseClient<any, "public", any> = createClient(supabaseUrl, supabaseAnonKey);
