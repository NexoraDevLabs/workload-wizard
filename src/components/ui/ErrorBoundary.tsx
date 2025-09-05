'use client';
import React from 'react';

export type ErrorBoundaryProps = {
  children: React.ReactNode;
  /** A simple node fallback or a render prop receiving the error + reset. */
  fallback?: React.ReactNode | ((args: { error: Error; reset: () => void }) => React.ReactNode);
  /** Optional tag/context string to group Sentry events (e.g., "ChartsPanel"). */
  contextTag?: string;
  /** Called after error captured (for local logs/metrics). */
  onErrorCaptured?: (error: Error, info: React.ErrorInfo) => void;
};

type State = { hasError: boolean; error?: Error | undefined };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Lazy import to avoid client bundle cost when Sentry disabled
    void import('../../lib/monitoring').then(({ captureUIException }) => {
      captureUIException(error, { 
        componentStack: info.componentStack || undefined, 
        contextTag: this.props.contextTag 
      });
    }).catch(() => { /* noop if monitoring not available */ });

    this.props.onErrorCaptured?.(error, info);
  }

  private reset = () => this.setState({ hasError: false, error: undefined });

  override render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    const error = this.state.error ?? new Error('Unknown error');

    if (typeof fallback === 'function') {
      return (fallback as (args: { error: Error; reset: () => void }) => React.ReactNode)({ error, reset: this.reset });
    }
    return fallback ?? (
      <div role="alert" data-testid="error-fallback" className="rounded-xl border p-4">
        <p className="font-medium">Something went wrong.</p>
        <button className="mt-2 rounded-lg border px-3 py-1 text-sm" onClick={this.reset}>Try again</button>
      </div>
    );
  }
}

export default ErrorBoundary;
