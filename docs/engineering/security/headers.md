# Security Headers and HTTPS Enforcement

This document outlines the security headers and HTTPS enforcement implemented in the Workload Wizard application.

## Security Headers

The following security headers are applied to all routes via `next.config.ts`:

### Strict-Transport-Security (HSTS)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**Purpose:** Forces browsers to use HTTPS for all future requests to this domain and its subdomains.

**Configuration:**

- `max-age=63072000`: 2 years (730 days)
- `includeSubDomains`: Applies to all subdomains
- `preload`: Enables inclusion in browser HSTS preload lists

⚠️ **Important:** HSTS preload is long-lived. To remove a domain from preload lists, you must submit a removal request at [hstspreload.org](https://hstspreload.org/).

### X-Frame-Options

```
X-Frame-Options: DENY
```

**Purpose:** Prevents the page from being embedded in frames/iframes, protecting against clickjacking attacks.

**Configuration:**

- `DENY`: Completely prevents framing
- Alternative: `SAMEORIGIN` (allows framing from same origin) - use only if iframe embedding is required

### X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

**Purpose:** Prevents browsers from MIME-sniffing content types, forcing them to respect the declared Content-Type header.

**Configuration:**

- `nosniff`: Only valid value, prevents content-type sniffing

### Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

**Purpose:** Controls how much referrer information is sent with requests.

**Configuration:**

- `strict-origin-when-cross-origin`: Sends full URL for same-origin requests, origin only for cross-origin HTTPS requests, no referrer for HTTP requests

## HTTPS Enforcement

HTTPS enforcement is implemented with a two-layer approach:

### 1. Platform-Level Enforcement (Preferred)

For Vercel deployments:

1. Go to Project Settings → Domains
2. Enable "Enforce HTTPS" for all domains
3. This handles redirects at the edge before reaching the application

For other platforms, configure similar HTTPS enforcement at the platform/proxy level.

### 2. Application-Level Fallback

The application includes a middleware-based HTTPS redirect as a safety net:

```typescript
// In middleware.ts
const proto = req.headers.get('x-forwarded-proto');
if (proto && proto !== 'https') {
  const url = new URL(req.url);
  url.protocol = 'https:';
  return NextResponse.redirect(url, 308);
}
```

**Configuration:**

- Uses `x-forwarded-proto` header (standard for most reverse proxies)
- Returns 308 Permanent Redirect (preserves request method and body)
- Runs before authentication checks

## Operational Notes

### Header Relaxation

If specific routes need different header values:

1. **Frame embedding**: Change `X-Frame-Options` to `SAMEORIGIN` or implement CSP `frame-ancestors`
2. **Per-route headers**: Use Next.js route-specific header configuration
3. **Risk assessment**: Document any relaxation with security justification

### Monitoring and Verification

#### Quick Verification

```bash
# Replace with your deployed URL
curl -sI https://your-domain.com | grep -Ei 'strict-transport|x-frame-options|x-content-type-options|referrer-policy'
```

#### Browser DevTools

1. Open DevTools → Network tab
2. Reload the page
3. Check response headers for the security headers

#### Security Scanners

- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers](https://securityheaders.com/)
- Include these in CI/CD pipeline for continuous monitoring

### Troubleshooting

#### HSTS Issues

- **Problem**: Browser caches HSTS, making local HTTP development difficult
- **Solution**: Use different hostnames for local development (e.g., `localhost` vs `127.0.0.1`)

#### Frame Embedding Blocked

- **Problem**: Third-party services can't embed the application
- **Solution**: Evaluate if embedding is necessary; if so, use `SAMEORIGIN` or CSP `frame-ancestors`

#### Mixed Content Warnings

- **Problem**: HTTP resources loaded on HTTPS pages
- **Solution**: Ensure all resources (images, scripts, stylesheets) use HTTPS URLs

## Implementation Details

### Next.js Configuration

Headers are configured in `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
];

// Applied to all routes
async headers() {
  return [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ];
}
```

### Middleware Integration

HTTPS redirect is integrated into the existing WorkOS authentication middleware to ensure it runs first:

```typescript
export default workosMiddleware(async (auth, req) => {
  // HTTPS redirect runs before auth checks
  const proto = req.headers.get('x-forwarded-proto');
  if (proto && proto !== 'https') {
    const url = new URL(req.url);
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  // ... rest of middleware logic
});
```

## Future Considerations

### Content Security Policy (CSP)

Consider implementing CSP headers for additional XSS protection:

- Start with `Content-Security-Policy-Report-Only` for testing
- Gradually tighten policy based on application requirements

### Additional Security Headers

Evaluate implementing:

- `Cross-Origin-Embedder-Policy` (COEP)
- `Cross-Origin-Opener-Policy` (COOP)
- `Cross-Origin-Resource-Policy` (CORP)

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/headers)
