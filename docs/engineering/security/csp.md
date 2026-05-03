# Content Security Policy (CSP) Guide

This guide covers the implementation, configuration, and management of Content Security Policy (CSP) in the WorkloadWizard application.

## Overview

Content Security Policy is a security feature that helps prevent Cross-Site Scripting (XSS) attacks by controlling which resources can be loaded and executed by the browser. Our implementation supports both report-only and enforce modes, allowing for safe rollout and monitoring.

## Architecture

### Components

1. **CSP Builder** (`src/lib/security/csp.ts`) - Core CSP policy generation
2. **Allowlist Configuration** (`config/security/csp.allowlist.ts`) - Environment-specific overrides
3. **Middleware** (`src/middleware.ts`) - Header injection and nonce generation
4. **Report Handler** (`src/app/api/csp-report/route.ts`) - Violation report collection
5. **Admin Dashboard** (`src/app/admin/csp/page.tsx`) - Violation monitoring and analysis

### Data Flow

```
Browser → CSP Policy → Violation → Report Handler → Convex DB → Admin Dashboard
```

## Configuration

### Environment Variables

| Variable   | Description          | Default       | Values                   |
| ---------- | -------------------- | ------------- | ------------------------ |
| `CSP_MODE` | CSP enforcement mode | `report-only` | `report-only`, `enforce` |

### Environment Matrix

| Environment | CSP Mode      | Purpose                               |
| ----------- | ------------- | ------------------------------------- |
| Development | `report-only` | Safe testing with violation reporting |
| Preview     | `report-only` | Pre-production validation             |
| Staging     | `report-only` | Production-like testing               |
| Production  | `enforce`     | Full security enforcement             |

## Usage

### Switching CSP Modes

#### Development/Local

```bash
# Switch to report-only mode
npm run csp:mode:report

# Switch to enforce mode
npm run csp:mode:enforce

# Check current CSP configuration
npm run csp:check
```

#### Production (Vercel)

1. Navigate to Vercel Dashboard
2. Go to your project → Settings → Environment Variables
3. Set `CSP_MODE` to `enforce` for Production environment
4. Redeploy the application

### Monitoring Violations

1. **Admin Dashboard**: Navigate to `/admin/csp` (requires sysadmin/developer role)
2. **Key Metrics**:
   - Total violations by time period
   - Top violated directives
   - Most blocked URIs
   - Recent violation details

3. **Filtering Options**:
   - Time range (1 hour, 24 hours, 7 days)
   - Directive type
   - Search by URI, source file, or user agent
   - Export to CSV

### Adjusting Allowlists

1. **Edit Configuration**: Modify `config/security/csp.allowlist.ts`
2. **Add Sources**: Add domains to appropriate directives
3. **Environment-Specific**: Use development/production/test overrides
4. **Redeploy**: Changes take effect on next deployment

Example:

```typescript
export const CSP_ALLOWLIST_OVERRIDES: Record<string, CSPAllowlistOverride> = {
  scriptSrc: {
    production: ['https://cdn.example.com', 'https://*.analytics.com'],
  },
  imgSrc: {
    development: ['http://localhost:*'],
  },
};
```

## Policy Structure

### Core Directives

- `default-src 'self'` - Default source for all resource types
- `script-src` - JavaScript sources (with nonce support)
- `style-src` - CSS sources (with nonce support)
- `img-src` - Image sources
- `connect-src` - XHR, fetch, WebSocket sources
- `font-src` - Font sources
- `frame-src` - Frame/iframe sources

### Security Features

- **Nonce-based Scripts**: All inline scripts require a nonce
- **Strict Dynamic**: Allows nonce-based scripts to load additional scripts
- **HTTPS Enforcement**: Upgrades insecure requests in production
- **Frame Ancestors**: Prevents clickjacking attacks

### Service Integration

The CSP policy automatically includes allowlists for:

- **Convex**: Database and real-time subscriptions
- **WorkOS**: Authentication and user management
- **Sentry**: Error monitoring and performance tracking
- **Statsig**: Feature flags and experimentation
- **Vercel**: Analytics and speed insights
- **PostHog**: Product analytics
- **Sanity**: Content management
- **Google Fonts**: Typography
- **Featurebase**: Customer feedback widget

## Rollout Process

### Phase 1: Report-Only Mode (1-2 weeks)

1. **Deploy with Report-Only**: Set `CSP_MODE=report-only`
2. **Monitor Violations**: Check `/admin/csp` regularly
3. **Analyze Patterns**: Identify common violation sources
4. **Adjust Allowlists**: Add legitimate sources to configuration
5. **Test Functionality**: Ensure all features work correctly

### Phase 2: Enforcement Mode

1. **Final Review**: Verify no critical violations remain
2. **Switch to Enforce**: Set `CSP_MODE=enforce`
3. **Monitor Closely**: Watch for any functionality issues
4. **Quick Rollback**: Be ready to switch back to report-only

### Rollback Procedure

If issues arise after switching to enforce mode:

1. **Immediate**: Set `CSP_MODE=report-only` in Vercel
2. **Redeploy**: Trigger a new deployment
3. **Investigate**: Use admin dashboard to identify issues
4. **Fix**: Update allowlist configuration
5. **Retry**: Switch back to enforce mode when ready

## Common Violations & Fixes

### Script Violations

| Violation               | Cause                        | Fix                       |
| ----------------------- | ---------------------------- | ------------------------- |
| `'unsafe-inline'`       | Inline scripts without nonce | Add nonce to script tag   |
| `'unsafe-eval'`         | Dynamic code evaluation      | Refactor to avoid eval()  |
| External script blocked | Missing domain in allowlist  | Add domain to `scriptSrc` |

### Style Violations

| Violation                   | Cause                   | Fix                      |
| --------------------------- | ----------------------- | ------------------------ |
| Inline styles blocked       | CSS-in-JS without nonce | Add nonce to style tag   |
| External stylesheet blocked | Missing domain          | Add domain to `styleSrc` |

### Image Violations

| Violation              | Cause           | Fix                     |
| ---------------------- | --------------- | ----------------------- |
| External image blocked | Missing domain  | Add domain to `imgSrc`  |
| Data URI blocked       | Missing `data:` | Add `data:` to `imgSrc` |

### Connect Violations

| Violation         | Cause            | Fix                        |
| ----------------- | ---------------- | -------------------------- |
| API call blocked  | Missing domain   | Add domain to `connectSrc` |
| WebSocket blocked | Missing protocol | Add `wss:` to `connectSrc` |

## Testing

### Local Testing

```bash
# Check CSP configuration
npm run csp:check

# Test in report-only mode
npm run csp:mode:report
npm run dev

# Test in enforce mode
npm run csp:mode:enforce
npm run dev
```

### CI Testing

The CI pipeline automatically validates:

- Correct header presence based on mode
- Policy structure and required directives
- Nonce generation and inclusion
- Reporting directives in report-only mode

### Manual Testing

1. **Browser DevTools**: Check Console for CSP violations
2. **Network Tab**: Verify all resources load correctly
3. **Admin Dashboard**: Confirm violations are being reported
4. **Functionality**: Test all application features

## Troubleshooting

### Common Issues

1. **Scripts Not Loading**
   - Check if nonce is properly applied
   - Verify script source is in allowlist
   - Ensure no `unsafe-inline` dependencies

2. **Styles Not Applying**
   - Check if nonce is properly applied
   - Verify style source is in allowlist
   - Ensure CSS-in-JS is nonce-compatible

3. **Images Not Loading**
   - Check image source domains
   - Verify `imgSrc` allowlist includes required domains
   - Check for data URI requirements

4. **API Calls Failing**
   - Check `connectSrc` allowlist
   - Verify API domain is included
   - Check for WebSocket requirements

### Debug Mode

Enable detailed CSP logging in development:

```typescript
// In src/lib/security/csp.ts
const isDevelopment = env.NODE_ENV === 'development';
if (isDevelopment) {
  console.log('CSP Policy:', cspPolicy);
  console.log('CSP Mode:', cspMode);
}
```

## Security Considerations

### Best Practices

1. **Principle of Least Privilege**: Only allow necessary sources
2. **Regular Review**: Periodically audit allowlist entries
3. **Time-Boxed Exceptions**: Add review dates for temporary allowances
4. **Documentation**: Document why each allowlist entry exists

### Risk Assessment

| Risk Level | Directive     | Impact                 |
| ---------- | ------------- | ---------------------- |
| High       | `script-src`  | XSS, code injection    |
| High       | `connect-src` | Data exfiltration      |
| Medium     | `style-src`   | CSS injection          |
| Medium     | `img-src`     | Information disclosure |
| Low        | `font-src`    | Resource loading       |

### Monitoring

- **Violation Trends**: Watch for sudden spikes in violations
- **New Sources**: Monitor for unexpected domains
- **Policy Changes**: Track allowlist modifications
- **Performance**: Ensure CSP doesn't impact page load times

## Maintenance

### Regular Tasks

1. **Weekly**: Review violation reports
2. **Monthly**: Audit allowlist entries
3. **Quarterly**: Review and update service integrations
4. **Annually**: Full security review and policy update

### Cleanup

- Remove unused allowlist entries
- Archive old violation reports
- Update service integrations as needed
- Review and update documentation

## References

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [CSP Test](https://csp-test.com/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
