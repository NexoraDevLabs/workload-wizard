# Security Policy

## Reporting Vulnerabilities

If you discover a security issue in WorkloadWizard, please do **not** open a public issue.  
Instead, email our team at **security@nexoradevlabs.com**.

We will acknowledge your report within **5 working days**, investigate, and provide a timeline for resolution.

## Supported Versions

As this is a private organisational tool, only the **latest `main` branch** is actively supported.

## Security Features

### Content Security Policy (CSP)

WorkloadWizard implements a comprehensive Content Security Policy to protect against XSS attacks:

- **Nonce-based script execution** for inline scripts
- **Dynamic allowlists** for external services (Convex, Clerk, Sentry, etc.)
- **Violation reporting** with admin dashboard at `/admin/csp`
- **Report-Only mode** by default for safe rollout

For detailed CSP documentation, see [docs/engineering/security/csp.md](docs/engineering/security/csp.md).

### Security Headers

- **Strict-Transport-Security** with HSTS preload
- **X-Frame-Options** set to DENY
- **X-Content-Type-Options** set to nosniff
- **Referrer-Policy** set to strict-origin-when-cross-origin

## Responsible Disclosure

We kindly ask that you:

- Report issues privately first.
- Do not exploit the issue.
- Allow us reasonable time to resolve before public disclosure.
