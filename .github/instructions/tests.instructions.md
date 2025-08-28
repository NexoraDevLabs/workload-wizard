---
applyTo: 'tests/**/*.{ts,tsx}'
---

- Vitest only; environment `jsdom`; never add tests under `node_modules`.
- Use Testing Library: prefer `getByRole`/`getByLabelText`; avoid brittle `getByTestId` unless necessary.
- Keep tests fast and isolated; mock network/Convex; clean up after each test.
- Name files `*.spec.ts(x)`; colocate in `tests/` or alongside source when small.
