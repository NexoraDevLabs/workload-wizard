# Content Security Policy (CSP) Implementation

This document describes the Content Security Policy implementation for WorkloadWizard, providing comprehensive protection against XSS attacks while maintaining full application functionality.

## Overview

The CSP implementation uses a nonce-based approach with dynamic allowlists that automatically detect and configure external services used by the application. It supports both Report-Only and Enforce modes for safe rollout.

## Architecture

### Core Components

1. **CSP Builder** (`src/lib/security/csp.ts`) - Policy generation and allowlist management
2. **Middleware Integration** (`src/middleware.ts`) - Nonce generation and header injection
3. **Violation Collection** (`src/app/api/csp-report/route.ts`) - Report processing and storage
4. **Admin Dashboard** (`src/app/admin/csp/page.tsx`) - Violation monitoring and analysis
5. **Convex Schema** (`convex/csp.ts`) - Violation report storage and queries

### Policy Structure

The CSP policy is built dynamically based on detected services and includes:

- **Core Security Directives**: `default-src`, `base-uri`, `object-src`, `frame-ancestors`
- **Nonce-based Script/Style Execution**: Uses cryptographically strong nonces
- **Service-specific Allowlists**: Automatically configured for detected integrations
- **Reporting**: Comprehensive violation collection and analysis

## Configuration

### Environment Variables

```bash
# CSP Mode (default: report-only)
CSP_MODE=report-only  # or 'enforce'

# Service-specific environment variables (auto-detected)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_STATSIG_CLIENT_KEY=...
FEATFLAG_STATSIG_SERVER_API_KEY=...
NEXT_PUBLIC_POSTHOG_KEY=...
```

### NPM Scripts

```bash
# Set CSP mode to report-only
pnpm csp:mode:report

# Set CSP mode to enforce
pnpm csp:mode:enforce
```

## Service Detection and Allowlists

The CSP builder automatically detects and configures allowlists for:

### Convex (Real-time Database)

- **Connect Sources**: `*.convex.cloud`, `*.convex.dev`
- **Detection**: `NEXT_PUBLIC_CONVEX_URL` environment variable

### Clerk (Authentication)

- **Script Sources**: `*.clerk.accounts.dev`, `*.clerk.com`
- **Connect Sources**: `*.clerk.accounts.dev`, `*.clerk.com`
- **Frame Sources**: `*.clerk.accounts.dev`, `*.clerk.com`
- **Image Sources**: `img.clerk.com`, `images.clerk.com`
- **Detection**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`

### Sentry (Error Monitoring)

- **Script Sources**: `*.sentry-cdn.com`, `*.sentry.io`
- **Connect Sources**: `*.sentry.io`, `*.sentry-cdn.com`
- **Image Sources**: `*.sentry.io`
- **Detection**: `NEXT_PUBLIC_SENTRY_DSN` environment variable

### Statsig (Feature Flags)

- **Script Sources**: `*.statsig.com`, `*.statsigapi.net`
- **Connect Sources**: `*.statsig.com`, `*.statsigapi.net`
- **Detection**: `NEXT_PUBLIC_STATSIG_CLIENT_KEY` or `FEATFLAG_STATSIG_SERVER_API_KEY`

### Vercel (Analytics & Speed Insights)

- **Script Sources**: `vitals.vercel-insights.com`, `va.vercel-scripts.com`
- **Connect Sources**: `vitals.vercel-insights.com`, `va.vercel-scripts.com`
- **Image Sources**: `va.vercel-scripts.com`
- **Detection**: Always enabled for Vercel deployments

### PostHog (Analytics)

- **Script Sources**: `eu-assets.i.posthog.com`, `eu.i.posthog.com`
- **Connect Sources**: `eu.i.posthog.com`, `eu-assets.i.posthog.com`
- **Image Sources**: `eu-assets.i.posthog.com`
- **Detection**: `NEXT_PUBLIC_POSTHOG_KEY` environment variable

### Sanity (CMS)

- **Image Sources**: `cdn.sanity.io`
- **Connect Sources**: `*.sanity.io`
- **Detection**: Always enabled (used for images)

### Google Fonts

- **Style Sources**: `fonts.googleapis.com`
- **Font Sources**: `fonts.gstatic.com`
- **Connect Sources**: `fonts.googleapis.com`, `fonts.gstatic.com`
- **Detection**: Always enabled (Geist fonts)

### Featurebase (Support Widget)

- **Script Sources**: `widget.featurebase.app`
- **Connect Sources**: `widget.featurebase.app`
- **Frame Sources**: `widget.featurebase.app`
- **Detection**: Always enabled (support widget)

## Nonce Implementation

### Generation

- **Method**: `crypto.randomUUID()` with fallback to `crypto.getRandomValues()`
- **Location**: Generated per request in middleware
- **Propagation**: Passed via `x-csp-nonce` header

### Usage

- **Scripts**: Use `nonce` prop on Next.js `<Script>` components
- **Styles**: Add `nonce` attribute to inline `<style>` blocks
- **Example**:
  ```tsx
  <Script nonce={nonce} strategy="afterInteractive">
    {`console.log('This script has a nonce');`}
  </Script>
  ```

## Violation Reporting

### Report Collection

- **Endpoint**: `/api/csp-report`
- **Formats**: Supports both `application/csp-report` and `application/reports+json`
- **Storage**: Convex database with privacy-focused sanitization

### Report Data

```typescript
interface CSPReport {
  timestamp: number;
  userAgent?: string; // Sanitized
  ipAddress?: string;
  effectiveDirective: string;
  violatedDirective: string;
  blockedURI?: string;
  documentURI?: string;
  referrer?: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  scriptSample?: string; // Limited to 1000 chars
  disposition?: string;
  originalPolicy?: string;
  organisationId?: string;
  userId?: string;
}
```

### Privacy Considerations

- **PII Stripping**: User agents sanitized, IP addresses optional
- **Data Retention**: Configurable cleanup (default 30 days)
- **Access Control**: Admin-only dashboard access

## Monitoring and Analysis

### Admin Dashboard

- **Location**: `/admin/csp`
- **Features**:
  - Real-time violation counts
  - Directive-based analysis
  - Resource-based analysis
  - Recent violation reports
  - Time range filtering

### Key Metrics

- **Total Violations**: Count of all CSP violations
- **Unique Directives**: Number of violated directives
- **Blocked Resources**: Count of unique blocked URIs
- **Status**: Clean vs. violations detected

## Deployment Strategy

### Phase 1: Report-Only Mode

1. Deploy with `CSP_MODE=report-only`
2. Monitor violations via admin dashboard
3. Refine allowlists based on violation data
4. Test all application functionality

### Phase 2: Staging Enforcement

1. Set `CSP_MODE=enforce` in staging environment
2. Verify zero functional regressions
3. Monitor for new violations
4. Fine-tune allowlists if needed

### Phase 3: Production Enforcement

1. Set `CSP_MODE=enforce` in production
2. Monitor closely for first 24-48 hours
3. Have rollback plan ready
4. Continue monitoring and refinement

## Rollback Procedure

### Immediate Rollback

```bash
# Set environment variable
CSP_MODE=report-only

# Redeploy application
vercel deploy --prod
```

### Emergency Disable

```bash
# Remove CSP headers entirely (if needed)
# Comment out CSP logic in middleware.ts
# Redeploy application
```

## Adding New Services

### 1. Update Service Allowlist

Add new service configuration to `SERVICE_ALLOWLISTS` in `src/lib/security/csp.ts`:

```typescript
const SERVICE_ALLOWLISTS: Record<string, Partial<CSPAllowlist>> = {
  // ... existing services
  newService: {
    scriptSrc: ['*.newservice.com'],
    connectSrc: ['*.newservice.com'],
    // ... other directives
  },
};
```

### 2. Add Detection Logic

Update `buildAllowlist` function to detect the service:

```typescript
if (env.NEXT_PUBLIC_NEW_SERVICE_KEY) {
  mergeAllowlist(allowlist, SERVICE_ALLOWLISTS.newService);
}
```

### 3. Update Environment Schema

Add environment variable to `src/lib/env.ts`:

```typescript
NEXT_PUBLIC_NEW_SERVICE_KEY: z.string().optional(),
```

### 4. Test and Validate

1. Test in report-only mode
2. Verify no violations for new service
3. Test in enforce mode
4. Update documentation

## Debugging Violations

### Common Violation Types

#### Script Violations

- **Cause**: Inline scripts without nonce
- **Solution**: Add nonce to `<Script>` components or move to external files

#### Style Violations

- **Cause**: Inline styles without nonce
- **Solution**: Add nonce to `<style>` blocks or move to external CSS

#### Connect Violations

- **Cause**: Missing allowlist for external API
- **Solution**: Add domain to `connectSrc` allowlist

#### Image Violations

- **Cause**: Missing allowlist for external images
- **Solution**: Add domain to `imgSrc` allowlist

### Debugging Tools

#### Browser DevTools

1. Open DevTools Console
2. Look for CSP violation messages
3. Check Network tab for blocked requests
4. Use Security tab for policy analysis

#### Admin Dashboard

1. Navigate to `/admin/csp`
2. Review violation summary
3. Analyze by directive or resource
4. Check recent reports for patterns

#### Manual Testing

```bash
# Test CSP headers
curl -I https://your-app.vercel.app

# Check for CSP headers
# Content-Security-Policy-Report-Only: ...
# or
# Content-Security-Policy: ...
```

## Best Practices

### Development

1. **Always use nonces** for inline scripts and styles
2. **Test in report-only mode** before enforcing
3. **Monitor violations** regularly during development
4. **Keep allowlists minimal** - only add what's necessary

### Production

1. **Start with report-only** mode
2. **Monitor violations** for at least one release cycle
3. **Refine allowlists** based on violation data
4. **Enforce gradually** - staging first, then production
5. **Have rollback plan** ready

### Maintenance

1. **Regular cleanup** of old violation reports
2. **Monitor for new services** that need allowlisting
3. **Update documentation** when adding services
4. **Review violations** monthly for security insights

## Security Considerations

### XSS Protection

- **Nonce-based execution** prevents inline script injection
- **Strict allowlists** limit resource loading
- **No unsafe-inline** for scripts or styles

### Data Privacy

- **PII sanitization** in violation reports
- **Limited data retention** for compliance
- **Admin-only access** to violation data

### Performance

- **Minimal allowlists** reduce policy size
- **Efficient nonce generation** per request
- **Optimized violation processing** for scale

## Troubleshooting

### Common Issues

#### CSP Not Applied

- Check middleware configuration
- Verify environment variables
- Check browser DevTools for errors

#### Violations Not Reported

- Verify `/api/csp-report` endpoint
- Check Convex connection
- Review browser console for errors

#### False Positives

- Review allowlist configuration
- Check for typos in domains
- Verify service detection logic

#### Performance Impact

- Monitor nonce generation overhead
- Check violation processing time
- Review database query performance

### Support

For issues or questions:

1. Check this documentation
2. Review admin dashboard
3. Check browser DevTools
4. Contact development team

## Version History

### v1.0 (2024-12-19)

- Initial CSP implementation
- Report-Only mode with comprehensive allowlists
- Nonce-based inline script/style execution
- Service-specific allowlists for all detected integrations
- Violation reporting and analysis dashboard
- Admin dashboard for monitoring
- Environment-based configuration
- Comprehensive documentation
