'use client';
import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div>
          <h2>Something went wrong</h2>
          <p>We&apos;ve logged this error. Please try refreshing the page.</p>
          {error?.digest ? (
            <small style={{ opacity: 0.7 }}>Error digest: {error.digest}</small>
          ) : null}
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            <button
              onClick={reset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{ color: '#0070f3', textDecoration: 'underline' }}
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
