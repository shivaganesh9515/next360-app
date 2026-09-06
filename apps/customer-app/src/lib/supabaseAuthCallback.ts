/**
 * Supabase OAuth Deep-Link Callback Handler
 *
 * When the user completes Google/Apple sign-in via Supabase's OAuth flow
 * (signInWithOAuth → system browser → redirect to next360://auth/callback),
 * this utility parses the URL fragment that Supabase appends to the callback
 * URL and exchanges the auth code for a full session.
 *
 * Flow:
 *  1. PhoneAuthScreen calls supabase.auth.signInWithOAuth({ provider: 'google' })
 *  2. System browser opens Google login
 *  3. Google redirects to https://<supabase-project>.supabase.co/auth/v1/callback
 *  4. Supabase redirects to next360://auth/callback#access_token=...&refresh_token=...
 *  5. Android/iOS deep-link opens the app with the URL
 *  6. App.tsx Linking listener calls handleSupabaseCallback(url)
 *  7. We set the session on the Supabase client — user is now authenticated
 *  8. Caller then calls googleSignIn() with the user's email/name to sync
 *     the Supabase user into the backend's own JWT / Prisma user table
 */

import { Linking } from 'react-native';
import * as LinkingExpo from 'expo-linking';
import { getSupabase, isSupabaseConfigured } from './supabase';

/**
 * Parses a next360://auth/callback URL and sets the Supabase session.
 * Returns the authenticated user's email + name for downstream backend sync,
 * or null if the URL is not a valid Supabase callback or Supabase is not configured.
 */
export async function handleSupabaseCallback(url: string): Promise<{
  email: string;
  name: string | undefined;
  avatarUrl: string | undefined;
  sub: string | undefined;
} | null> {
  if (!isSupabaseConfigured()) return null;

  // Accept both production scheme (next360://) and Expo Go dev scheme (exp://)
  // Supabase appends the session as a URL fragment (#) or PKCE code in query string.
  const isAuthCallback =
    url.includes('auth/callback') ||
    url.includes('auth/');

  if (!isAuthCallback) return null;

  const supabase = getSupabase();

  try {
    // Try PKCE exchange first (recommended for mobile — avoids fragment parsing)
    const { data, error } = await supabase.auth.exchangeCodeForSession(url);

    if (error) {
      // Fall back to setSession if code exchange fails (hash-based fallback)
      const fragment = url.split('#')[1];
      if (!fragment) return null;

      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) return null;

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError || !sessionData?.user) return null;

      const user = sessionData.user;
      return {
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url,
        sub: user.id,
      };
    }

    if (!data?.user) return null;

    const user = data.user;
    return {
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
      sub: user.id,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the initial URL if the app was opened via a deep link
 * (e.g. the user tapped the OAuth redirect while the app was closed).
 * Call this once in App.tsx useEffect to handle cold-start OAuth callbacks.
 */
export async function getInitialOAuthUrl(): Promise<string | null> {
  try {
    // Use expo-linking for consistent URL handling across Expo Go + standalone
    const url = await LinkingExpo.getInitialURL();
    if (url) return url;
    return await Linking.getInitialURL();
  } catch {
    return null;
  }
}

/**
 * Builds the OAuth redirect URL that must be whitelisted in Supabase dashboard:
 * Dashboard → Authentication → URL Configuration → Redirect URLs
 * Add both: next360://auth/callback and exp://.../--/auth/callback (for Expo Go)
 */
export function getOAuthRedirectUrl(): string {
  return LinkingExpo.createURL('auth/callback', { scheme: 'next360' });
}
