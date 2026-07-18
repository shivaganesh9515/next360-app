import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-anon-key';

/**
 * Check whether real Supabase credentials are configured in the environment.
 * Returns false when using the placeholder defaults, preventing wasteful
 * network calls against a fake project.
 */
export function isSupabaseConfigured(): boolean {
  return !!rawUrl && !!rawKey &&
    rawUrl !== 'https://placeholder.supabase.co' &&
    rawKey !== 'placeholder-anon-key';
}

const supabaseUrl = rawUrl || FALLBACK_URL;
const supabaseAnonKey = rawKey || FALLBACK_KEY;

let _supabase: SupabaseClient | null = null;

/**
 * Get or lazily initialise the Supabase client singleton.
 * Auth persistence uses localStorage (Next.js web — no AsyncStorage needed).
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return _supabase;
}

/**
 * Backward-compatible named export that proxies to the lazy singleton.
 * Usage: `import { supabase } from '@/lib/supabase'`
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});
