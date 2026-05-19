# Error Boundaries

This document describes the error boundary system implemented in the Workload Wizard application to provide graceful error handling and monitoring.

## Overview

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of the component tree that crashed. They catch errors during rendering, in lifecycle methods, and in constructors of the whole tree below them.

## Components

### ErrorBoundary

The main error boundary component located at `src/components/ui/ErrorBoundary.tsx`.

```tsx
import ErrorBoundary from '@/components/ui/ErrorBoundary';

<ErrorBoundary
  contextTag="MyComponent"
  fallback={({ error, reset }) => (
    <CustomFallback error={error} reset={reset} />
  )}
  onErrorCaptured={(error, info) => console.log('Error captured:', error)}
>
  <RiskyComponent />
</ErrorBoundary>;
```

#### Props

- `children`: React.ReactNode - The component tree to wrap
- `fallback?`: React.ReactNode | ((args: { error: Error; reset: () => void }) => React.ReactNode) - Custom fallback UI
- `onErrorCaptured?`: (error: Error, info: React.ErrorInfo) => void - Callback for local error handling

### DefaultErrorFallback

A pre-built fallback component with a clean, accessible design.

```tsx
import { DefaultErrorFallback } from '@/components/ui/ErrorFallback';

<ErrorBoundary
  fallback={({ error, reset }) => (
    <DefaultErrorFallback error={error} reset={reset} />
  )}
>
  <MyComponent />
</ErrorBoundary>;
```

### withErrorBoundary HOC

Higher-order component for wrapping components with error boundaries.

```tsx
import { withErrorBoundary } from '@/components/ui/withErrorBoundary';

const SafeComponent = withErrorBoundary(MyComponent, {
  contextTag: 'MyComponent',
});
```

## When to Use Error Boundaries

### High-Risk Components

Error boundaries should be placed around components that are most likely to throw errors:

1. **Data Visualization Components**
   - Charts and graphs using third-party libraries (Recharts, D3)
   - Complex data processing and rendering

2. **Third-Party Integrations**
   - External widgets (FeatureBase, analytics)
   - Embedded content and iframes

3. **Complex Forms**
   - Multi-step forms with validation
   - File upload components
   - Rich text editors

4. **Dynamic Content**
   - Components with aggressive Suspense usage
   - Feature flag-dependent components
   - Dynamic imports

### Placement Strategy

- **Localized Boundaries**: Place boundaries around specific high-risk components, not the entire app
- **Granular Control**: Use multiple boundaries to isolate different error sources
- **User Experience**: Ensure critical app functionality remains available when non-critical components fail

## Monitoring Integration

```typescript
// Automatically captures errors with context
captureUIException(error, {
  contextTag: 'ChartsPanel',
  componentStack: info.componentStack,
  extras: { userId: '123' },
});
```

### Error Context

- **ui.context**: Component context tag for grouping
- **componentStack**: React component stack trace
- **Custom extras**: Additional context data

### No-Op Mode

## Implementation Examples

### Chart Component

```tsx
// src/components/ui/chart.tsx
function ChartContainer({ children, config, ...props }) {
  return (
    <ErrorBoundary
      contextTag="ChartContainer"
      fallback={({ error, reset }) => (
        <DefaultErrorFallback error={error} reset={reset} />
      )}
    >
      <ChartContext.Provider value={{ config }}>
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </ChartContext.Provider>
    </ErrorBoundary>
  );
}
```

### Third-Party Widget

```tsx
// src/components/domain/FeatureBaseWidget.tsx
export default function FeaturebaseMessenger() {
  return (
    <ErrorBoundary
      contextTag="FeaturebaseMessenger"
      fallback={({ error, reset }) => (
        <DefaultErrorFallback error={error} reset={reset} />
      )}
    >
      <FeaturebaseMessengerInternal />
    </ErrorBoundary>
  );
}
```

### HOC Pattern

```tsx
// For wrapping entire components
const SafeRichTextEditor = withErrorBoundary(RichTextEditor, {
  contextTag: 'RichTextEditor',
});
```

## Testing

### Unit Tests

Comprehensive tests are located at `src/components/ui/__tests__/ErrorBoundary.test.tsx`:

- Renders children when no error
- Renders fallback when error thrown
- Handles both node and render-prop fallbacks
- Tests reset functionality
- Handles monitoring failures gracefully

### Test Components

```tsx
// Components that throw for testing
const ThrowingComponent = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Success</div>;
};

const ThrowingInEffect = ({ shouldThrow }) => {
  useEffect(() => {
    if (shouldThrow) throw new Error('Effect error');
  }, [shouldThrow]);
  return <div>Effect component</div>;
};
```

## Best Practices

### Error Boundary Placement

1. **Don't wrap the entire app** - Use localized boundaries
2. **Place around risky components** - Charts, third-party widgets, complex forms
3. **Consider user flows** - Ensure critical functionality remains available

### Fallback UI Design

1. **Accessible** - Use proper ARIA roles and semantic HTML
2. **Informative** - Show clear error messages to users
3. **Recoverable** - Provide reset/retry functionality
4. **Consistent** - Use design system components

### Error Context

2. **Rich metadata** - Include relevant context data
3. **Component stack** - Always include React component stack

### Performance

2. **No-op fallbacks** - Handle missing dependencies gracefully
3. **Minimal bundle impact** - Keep error boundary code lightweight

## Troubleshooting

### Common Issues

1. **Error boundaries don't catch async errors** - Use try/catch in async functions
2. **Event handlers not caught** - Wrap event handlers in try/catch
3. **Server-side rendering** - Ensure boundaries are client-side only

### Debugging

2. **Console logs** - Use onErrorCaptured for local debugging
3. **Component stack** - Review React DevTools for component hierarchy

## Migration Guide

### Adding Error Boundaries to Existing Components

1. **Identify risky components** - Charts, forms, third-party widgets
2. **Add ErrorBoundary wrapper** - Import and wrap component
3. **Test error scenarios** - Verify fallback UI and reset functionality

### Gradual Rollout

1. **Start with high-risk components** - Charts and third-party widgets
2. **Monitor error rates** - Ensure boundaries are working correctly
3. **Expand coverage** - Add boundaries to additional components
4. **Refine fallbacks** - Improve UI based on user feedback
