# CSP Policy Version 1.0

**Initial Rollout**: 2024-12-19  
**Status**: Report-Only Mode  
**Enforcement Target**: After violation analysis and allowlist refinement

## Policy Overview

This is the initial Content Security Policy implementation for WorkloadWizard, designed to provide comprehensive protection against XSS attacks while maintaining full application functionality.

## Core Directives

### Security Foundations

- `default-src 'self'` - Restrict all resources to same-origin by default
- `base-uri 'self'` - Prevent base tag injection attacks
- `object-src 'none'` - Block all object, embed, and applet elements
- `frame-ancestors 'none'` - Prevent clickjacking attacks

### Script Security

- `script-src 'self' 'strict-dynamic' 'nonce-{nonce}' https:` - Allow same-origin scripts, nonced inline scripts, and trusted external scripts
- Uses nonces for inline script execution
- `strict-dynamic` allows nonced scripts to load additional scripts

### Style Security

- `style-src 'self' 'nonce-{nonce}' https:` - Allow same-origin styles, nonced inline styles, and trusted external styles
- Uses nonces for inline style execution

### Resource Loading

- `img-src 'self' data: blob: https:` - Allow images from same-origin, data URLs, blob URLs, and HTTPS
- `font-src 'self' data: https:` - Allow fonts from same-origin, data URLs, and HTTPS
- `connect-src 'self' https: wss:` - Allow connections to same-origin, HTTPS, and WebSocket connections
- `media-src 'self' blob: https:` - Allow media from same-origin, blob URLs, and HTTPS
- `worker-src 'self' blob:` - Allow workers from same-origin and blob URLs
- `manifest-src 'self'` - Allow manifest from same-origin only

## Service-Specific Allowlists

### Convex (Real-time Database)

- `connect-src *.convex.cloud *.convex.dev` - Allow connections to Convex deployments

### WorkOS (Authentication)

- `script-src *.workos.accounts.dev *.workos.com` - Allow WorkOS authentication scripts
- `connect-src *.workos.accounts.dev *.workos.com` - Allow WorkOS API connections
- `frame-src *.workos.accounts.dev *.workos.com` - Allow WorkOS authentication frames
- `img-src img.workos.com images.workos.com` - Allow WorkOS user avatars

### Statsig (Feature Flags)

- `script-src *.statsig.com *.statsigapi.net` - Allow Statsig feature flag scripts
- `connect-src *.statsig.com *.statsigapi.net` - Allow Statsig API connections

### Vercel (Analytics & Speed Insights)

- `script-src vitals.vercel-insights.com va.vercel-scripts.com` - Allow Vercel analytics scripts
- `connect-src vitals.vercel-insights.com va.vercel-scripts.com` - Allow Vercel analytics
- `img-src va.vercel-scripts.com` - Allow Vercel analytics images

### PostHog (Analytics - Currently Disabled)

- `script-src eu-assets.i.posthog.com eu.i.posthog.com` - Allow PostHog analytics scripts
- `connect-src eu.i.posthog.com eu-assets.i.posthog.com` - Allow PostHog analytics
- `img-src eu-assets.i.posthog.com` - Allow PostHog analytics images

### Sanity (CMS)

- `img-src cdn.sanity.io` - Allow Sanity CMS images
- `connect-src *.sanity.io` - Allow Sanity API connections

### Google Fonts

- `style-src fonts.googleapis.com` - Allow Google Fonts stylesheets
- `font-src fonts.gstatic.com` - Allow Google Fonts font files
- `connect-src fonts.googleapis.com fonts.gstatic.com` - Allow Google Fonts connections

### Featurebase (Support Widget)

- `script-src widget.featurebase.app` - Allow Featurebase support widget
- `connect-src widget.featurebase.app` - Allow Featurebase API connections
- `frame-src widget.featurebase.app` - Allow Featurebase support frames

## Nonce Implementation

- **Generation**: Cryptographically strong nonces generated per request using `crypto.randomUUID()`
- **Propagation**: Nonces passed via middleware headers and consumed by Next.js `<Script>` components
- **Usage**: All inline scripts and styles must use the nonce attribute

## Reporting

### Report-Only Mode

- `report-uri /api/csp-report` - Send violation reports to internal endpoint
- `report-to csp-endpoint` - Use Reporting API for violation reports
- Reports stored in Convex database for analysis

### Violation Analysis

- Dashboard available at `/admin/csp` for violation monitoring
- Automatic grouping by directive and blocked URI
- Privacy-focused: PII stripped from reports

## Enforcement Strategy

1. **Phase 1**: Report-Only mode in all environments
2. **Phase 2**: Monitor violations and refine allowlists
3. **Phase 3**: Enforce in staging/preview environments
4. **Phase 4**: Enforce in production after validation

## Rollback Plan

To disable CSP enforcement:

1. Set `CSP_MODE=report` environment variable
2. Redeploy application
3. CSP will revert to Report-Only mode

## Future Considerations

- Consider implementing `require-trusted-types-for 'script'` for additional script security
- Evaluate `trusted-types` policy for DOM manipulation security
- Monitor for new service integrations that may require allowlist updates

## Changelog

### v1.0 (2024-12-19)

- Initial CSP implementation
- Report-Only mode with comprehensive allowlists
- Nonce-based inline script/style execution
- Service-specific allowlists for all detected integrations
- Violation reporting and analysis dashboard
