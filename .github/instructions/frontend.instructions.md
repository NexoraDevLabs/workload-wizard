---
applyTo: "src/**/*.{ts,tsx}"
---

- Prefer Server Components; use `"use client"` only when needed (event handlers, imperative APIs).
- Use shadcn/ui and lucide-react; keep Tailwind classes readable; extract variants with class-variance-authority (cva) when repeated.
- A11y: interactive elements must be reachable by keyboard and have ARIA where appropriate; use `Button`/`Link` rather than raw tags for consistency.
- Next.js data: avoid fetch in client when server/Convex is appropriate; co-locate loading/error UI; use `Suspense` for async boundaries.
- Never import server-only modules into client files.
