'use client';
import React from 'react';

export function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div role="alert" className="rounded-2xl border p-4">
      <h2 className="text-lg font-semibold">We hit a snag</h2>
      <p className="mt-1 text-sm opacity-80">{error.message}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={reset} className="rounded-xl border px-3 py-1 text-sm">
          Try again
        </button>
      </div>
    </div>
  );
}
