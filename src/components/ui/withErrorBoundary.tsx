'use client';
import React from 'react';
import ErrorBoundary, { type ErrorBoundaryProps } from './ErrorBoundary';

export function withErrorBoundary<P extends React.JSX.IntrinsicAttributes>(
  Comp: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary {...boundaryProps}>
      <Comp {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `WithErrorBoundary(${Comp.displayName ?? Comp.name ?? 'Component'})`;
  return Wrapped;
}
