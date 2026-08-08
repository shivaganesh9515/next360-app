import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// The .env placeholders ('https://your-project.supabase.co', 'your-anon-key')
// aren't a real project — createClient() throws synchronously ("supabaseUrl
// is required") if either arg is falsy, and every realtime subscription in
// this app calls getSupabase() inside a useEffect, so an uncaught throw there
// crashes the whole tree (React has no default recovery for an effect error).
// Falling back to well-formed dummy strings means construction never throws;
// isSupabaseConfigured() is what call sites check before actually trying to
// subscribe, so no pointless network call is made against the fake project.
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-anon-key';

export function isSupabaseConfigured(): boolean {
  const configured = !!rawUrl && !!rawKey && rawUrl !== 'https://your-project.supabase.co' && rawKey !== 'your-anon-key';
  // Warn in production if Supabase is not properly configured
  if (!__DEV__ && !configured) {
    console.error('[SECURITY] Supabase is not configured. Auth and realtime features will not work.');
  }
  return configured;
}

const supabaseUrl = rawUrl || FALLBACK_URL;
const supabaseAnonKey = rawKey || FALLBACK_KEY;

let _supabase: SupabaseClient | null = null;

function getStorage() {
  // SSR / Node.js — no AsyncStorage available
  if (typeof window === 'undefined') return undefined;
  try {
    // Dynamic import so it doesn't blow up on web SSR
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  } catch {
    return undefined;
  }
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: getStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabase;
}

// Backward-compatible named export (lazy)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});
