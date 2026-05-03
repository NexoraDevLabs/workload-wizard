# Bundle Analysis

This document explains how to use and interpret bundle analysis reports for the WorkloadWizard application.

## What is Bundle Analysis?

Bundle analysis provides visual insights into your JavaScript bundle sizes, helping identify:

- Largest modules and dependencies
- Duplicated code across routes
- Unused or oversized dependencies
- Client vs server bundle composition

The analysis is generated using `@next/bundle-analyzer` and produces interactive HTML reports showing bundle composition as treemaps.

## How to Run

### Locally

```bash
npm run analyze
```

This will:

1. Build the application with `ANALYZE=true`
2. Generate static HTML reports in `.next/analyze/`
3. Open the reports in your browser (if `openAnalyzer: true`)

After running, open these files in your browser:

- `.next/analyze/client.html` - Client-side bundle analysis
- `.next/analyze/server.html` - Server-side bundle analysis

### CI/CD

The bundle analysis runs automatically:

- **Manual**: Go to Actions → Bundle Analysis → Run workflow
- **Scheduled**: Every Monday at 02:00 UTC
- **Custom ref**: Specify any branch, tag, or commit SHA

Reports are uploaded as downloadable artifacts with 30-day retention.

## How to Read the Report

### Key Metrics to Look For

1. **Bundle Size**: Total size of client/server bundles
2. **Largest Modules**: Identify the biggest contributors to bundle size
3. **Duplicate Dependencies**: Same library appearing in multiple chunks
4. **Route-specific Code**: Code that could be dynamically imported

### Visual Interpretation

- **Rectangle size** = module size (larger = more bytes)
- **Color intensity** = relative size within the bundle
- **Nesting** = module hierarchy and dependencies

### What to Focus On

- **Client Bundle**:
  - Large vendor libraries (React, UI components)
  - Images, fonts, or assets
  - Route-specific code that could be code-split
  - Unused dependencies

- **Server Bundle**:
  - Unexpected client-side libraries
  - Large server-only dependencies
  - Database/API client code

## Common Optimizations

### 1. Dynamic Imports

Convert route-specific code to dynamic imports:

```typescript
// Before
import HeavyComponent from './HeavyComponent';

// After
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />
});
```

### 2. Tree Shaking

Use specific imports instead of barrel exports:

```typescript
// Before
import { Button } from '@radix-ui/react-button';

// After
import { Button } from '@radix-ui/react-button/dist/index.js';
```

### 3. Type-only Imports

Ensure types aren't included in runtime bundles:

```typescript
// Before
import { User } from './types';

// After
import type { User } from './types';
```

### 4. Icon Optimization

Import only needed icons:

```typescript
// Before
import { Icon1, Icon2, Icon3 } from 'lucide-react';

// After
import { Icon1 } from 'lucide-react/dist/esm/icons/icon1';
```

### 5. Asset Optimization

- Use Next.js Image component for images
- Optimize fonts and use `font-display: swap`
- Consider WebP/AVIF formats for images

## What "Good" Looks Like

### Healthy Bundle Characteristics

- **Client bundle < 500KB** (gzipped)
- **No duplicate dependencies** across chunks
- **Progressive loading** with code splitting
- **Minimal vendor bundle** growth over time

### Red Flags

- Single massive chunk (>1MB)
- Same library in multiple chunks
- Large images in JavaScript bundles
- Server-only code in client bundles

## Monitoring Trends

### Track These Metrics

1. **Bundle size over time** - Should grow slowly
2. **Largest dependencies** - Watch for sudden increases
3. **Code splitting effectiveness** - More chunks = better loading
4. **Duplicate code** - Should decrease over time

### After Major Changes

Always run bundle analysis after:

- Adding new dependencies
- Implementing new features
- Updating UI libraries
- Changing build configuration

## Troubleshooting

### Empty Reports

If `.next/analyze/` is empty:

1. Verify `ANALYZE=true` is set
2. Check that `@next/bundle-analyzer` is installed
3. Ensure `next.config.ts` has the bundle analyzer configured

### Build Failures

If analysis build fails:

1. Check Node.js memory limits (`NODE_OPTIONS="--max-old-space-size=4096"`)
2. Verify all dependencies are installed
3. Check for TypeScript errors

## CI Artifacts

### Accessing Reports

1. Go to the GitHub Actions tab
2. Find the "Bundle Analysis" workflow run
3. Click on the "analyze" job
4. Download the `bundle-analysis-{run_number}` artifact
5. Extract and open `client.html` and `server.html`

### Retention Policy

- Reports are kept for **30 days**
- Manual runs are preserved longer than scheduled runs
- Download important reports for long-term tracking

## Further Reading

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Webpack Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
