'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  /** Compact variant for panels inside a page (dashboard cards); full for page-level failures. */
  compact?: boolean;
}

export default function ErrorState({ message, onRetry, compact = false }: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5 text-rose-500" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-700">Couldn&apos;t load this data</p>
      {message && <p className="text-xs text-slate-400 mt-1 max-w-xs truncate">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
