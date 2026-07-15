import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback to placeholders so construction never throws when env vars aren't set.
// Use isSupabaseConfigured() to check before making actual API calls.
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-anon-key';

export function isSupabaseConfigured(): boolean {
  return !!rawUrl && !!rawKey
    && rawUrl !== 'https://placeholder.supabase.co'
    && rawKey !== 'placeholder-anon-key';
}

const supabaseUrl = rawUrl || FALLBACK_URL;
const supabaseAnonKey = rawKey || FALLBACK_KEY;

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabase;
}

// Backward-compatible named export (lazy proxy)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});
