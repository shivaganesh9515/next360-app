'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Route-level error boundary. Without this file a thrown render/data error
 * unmounts the whole dashboard (white screen). Next.js App Router requires
 * error.tsx to catch client-side exceptions per route segment.
 *
 * The empty/failed-fetch path is handled by useApiData + ErrorState; this
 * catches the crashes those can't (bugs in render code, bad data shape).
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced for debugging; in production this is where a crash reporter hooks in.
    console.error('Dashboard route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
      <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-rose-500" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-slate-800">Something went wrong</h2>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">
        The page hit an unexpected error. Your data is safe — try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        <RotateCcw className="w-4 h-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
