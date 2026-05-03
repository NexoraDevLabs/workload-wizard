# Bundle Reports How-to Guide

## What it is

Bundle analysis provides visualisation of your JavaScript bundle size and composition, helping you:

- Identify heavy modules and dependencies
- Find code duplication and unused imports
- Optimise client and server bundle sizes
- Prevent performance regressions

## How to Generate

### CI Pipeline

Bundle analysis runs automatically on every PR and main branch push:

1. **Trigger**: Push to any branch or open PR
2. **Workflow**: "Bundle Analysis" in GitHub Actions
3. **Output**: HTML reports uploaded as workflow artefacts
4. **Retention**: Reports kept for 30 days

**Access**: GitHub Actions → Bundle Analysis → Download artefacts

### Local Generation

Generate reports locally for development:

```bash
# Install dependencies (if not already done)
npm install

# Generate bundle analysis
npm run analyze

# Open reports in browser
open .next/analyze/client.html
open .next/analyze/server.html
```

**Output Files**:

- `.next/analyze/client.html` — Client-side bundle analysis
- `.next/analyze/server.html` — Server-side bundle analysis
- `.next/analyze/edge.html` — Edge runtime bundle analysis

## How to Interpret

### Bundle Size Overview

**Total Bundle Size**:

- **Client**: Target < 250KB gzipped
- **Server**: Target < 500KB gzipped
- **Edge**: Target < 100KB gzipped

**Size Breakdown**:

- **Your Code**: Application-specific code
- **Dependencies**: Third-party libraries
- **Node Modules**: External packages
- **Chunks**: Code-split bundles

### Identifying Issues

#### Heavy Modules

Look for modules taking > 10% of total bundle:

```bash
# Common heavy modules to watch
- react-dom (50-80KB)
- @next/font (20-40KB)
- date-fns (30-60KB)
- lodash (50-100KB)
- moment.js (60-100KB)
```

#### Code Duplication

Identify duplicate code across chunks:

- **Same module in multiple chunks**: Look for repeated dependencies
- **Similar functionality**: Multiple libraries doing the same thing
- **Unused imports**: Dead code taking up space

#### Route Bloat

Check for oversized route bundles:

- **Page bundles > 100KB**: Consider code splitting
- **API route bundles > 50KB**: Review server-side dependencies
- **Shared chunks > 200KB**: Optimise common dependencies

#### Server Bundling Issues

Identify client-only code in server bundles:

- **Browser APIs**: `window`, `document`, `localStorage`
- **Client libraries**: React components, UI libraries
- **Development tools**: Debug utilities, hot reload code

## Common Optimisation Actions

### Dynamic Imports

Split large modules into dynamic imports:

```typescript
// ❌ Bad: Large module loaded upfront
import { HeavyChart } from '@/components/HeavyChart';

// ✅ Good: Dynamic import when needed
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>
});
```

### Replace Heavy Libraries

Swap heavy libraries for lighter alternatives:

```typescript
// ❌ Bad: Heavy date library
import moment from 'moment'; // 60KB+

// ✅ Good: Lightweight alternative
import { format, parseISO } from 'date-fns'; // 20KB
```

### Tree Shaking

Ensure proper tree shaking:

```typescript
// ❌ Bad: Import entire library
import _ from 'lodash';

// ✅ Good: Import specific functions
import { debounce, throttle } from 'lodash-es';
```

### Per-Icon Imports

Import only needed icons:

```typescript
// ❌ Bad: Import entire icon library
import { Icon } from '@tabler/icons-react';

// ✅ Good: Import specific icons
import { IconUser, IconSettings } from '@tabler/icons-react';
```

### Drop Unused Locales

Remove unused internationalisation:

```typescript
// ❌ Bad: Include all locales
import 'date-fns/locale';

// ✅ Good: Import only needed locales
import { enGB } from 'date-fns/locale';
```

## Bundle Analysis Workflow

### CI Integration

The bundle analysis workflow:

1. **Runs on**: Every push and PR
2. **Generates**: Client, server, and edge bundle reports
3. **Uploads**: HTML reports as GitHub artefacts
4. **Retention**: 30 days
5. **Notifications**: Comments on PRs with size changes

### PR Comments

Bundle analysis automatically comments on PRs with:

- **Size changes**: Before/after bundle sizes
- **New dependencies**: Added packages and their impact
- **Size regression warnings**: When bundles exceed thresholds

### Size Thresholds

Current size limits:

```yaml
client_bundle:
  warning: 250KB
  error: 300KB

server_bundle:
  warning: 500KB
  error: 600KB

edge_bundle:
  warning: 100KB
  error: 150KB
```

## Optimisation Checklist

### Before Each Release

- [ ] Review bundle analysis reports
- [ ] Check for new heavy dependencies
- [ ] Verify size thresholds are met
- [ ] Test performance impact of changes

### Monthly Review

- [ ] Audit largest dependencies
- [ ] Remove unused packages
- [ ] Update to lighter alternatives
- [ ] Review code splitting strategy

### Performance Testing

After bundle optimisations:

```bash
# Test bundle size impact
npm run analyze

# Test runtime performance
npm test:performance

# Test Core Web Vitals
npm test:lighthouse
```

## Advanced Analysis

### Webpack Bundle Analyzer

For detailed analysis, use the webpack bundle analyzer:

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Generate detailed report
ANALYZE=true npm run build
```

### Bundle Comparison

Compare bundles between versions:

```bash
# Compare current vs previous
npm run analyze:compare

# Compare branches
npm run analyze:compare main dev
```

### Dependency Analysis

Identify problematic dependencies:

```bash
# Find duplicate packages
npm why package-name

# Check dependency tree
npm list --depth=0

# Audit for vulnerabilities
npm audit
```

## Troubleshooting

### Missing Reports

1. **Check build success**: Ensure `npm run build` completes successfully
2. **Verify Next.js config**: Confirm bundle analyzer is enabled
3. **Check file permissions**: Ensure write access to `.next/analyze/`
4. **Review CI logs**: Check GitHub Actions for build errors

### Inaccurate Sizes

1. **Clear cache**: Delete `.next` folder and rebuild
2. **Check environment**: Ensure production build mode
3. **Verify dependencies**: Confirm all packages are installed
4. **Review config**: Check Next.js and webpack configuration

### Performance Impact

1. **Monitor build time**: Bundle analysis adds ~30s to build
2. **Check CI resources**: Ensure sufficient memory for analysis
3. **Optimise queries**: Use smaller time ranges for analysis
4. **Consider scheduling**: Run analysis during off-peak hours

## Related Documentation

- [Traces Guide](./traces.md) — Runtime performance monitoring
- [Dashboards Guide](./dashboards.md) — Visualising performance metrics
- [Performance Monitoring](../engineering/perf/) — Performance optimisation guidelines
