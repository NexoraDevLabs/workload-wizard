---
applyTo: "convex/**/*.ts"
---

- Keep validators with `v.*`; validate all mutation args; avoid `any`.
- Use indexes for frequent queries; avoid full scans on large tables.
- Enforce auth/role checks at the server boundary; no client-side trust.
- Split large mutations; keep deterministic and idempotent where possible.
- Document schema changes in PR description; provide migration steps.
