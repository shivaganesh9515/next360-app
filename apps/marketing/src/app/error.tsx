'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Marketing site error:', error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <p className="font-display text-6xl text-brand-primary mb-4">Oops</p>
      <h1 className="font-display text-2xl md:text-3xl font-semibold text-text-primary mb-3">
        Something went wrong
      </h1>
      <p className="text-text-secondary max-w-md mb-8">
        We hit an unexpected snag loading this page. Please try again — your session is safe.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-brand-accent text-white text-sm font-semibold shadow-btn hover:scale-105 transition-all duration-300"
      >
        Try Again
      </button>
    </main>
  );
}
