# Repository Custom Instructions (Copilot)

## Overview

WorkloadWizard: multi-tenant academic workload web app (Next.js + Convex). Repo uses **npm**, Node from **.nvmrc**, TypeScript (strict), Vitest, ESLint + Prettier, Tailwind/shadcn UI. Auth by WorkOS. CI is split into Format, Quality (lint/typecheck/test/build), CodeQL, Semgrep. AI PR reviews are label-gated (`ai-review`, `ai-deep`, `ai-ultra`).

## Build & Validate (always follow in this order)

1. **Setup**
   - Use Node from `.nvmrc`.
   - `npm install --frozen-lockfile`
2. **Format**
   - PRs: `npm prettier --check .`
   - Local: `npm prettier --write .` (do not commit style churn beyond touched files)
3. **Lint & Types**
   - `npm run lint`
   - `npm run typecheck`
4. **Tests**
   - `npm test` (Vitest, jsdom; only runs tests under `src/**` or `tests/**`; never in `node_modules`)
5. **Build**
   - `npm run build`
6. **Env**
   - Local/dev env goes in `.env.local` (never commit). CI uses repo/org secrets.

If any step fails locally, Copilot should propose the minimal change needed to make CI pass, preserving existing patterns and constraints.

## Project Layout (typical)

- `src/` (app code; Next.js app router)
- `convex/` (Convex schema, queries, mutations)
- `tests/` (Vitest)
- `.github/workflows/` (Format, Quality, CodeQL, Semgrep, AI review)
- Config: `tsconfig.json`, `eslint.config.*`, `postcss.config.*`, `tailwind.config.*`, `.prettierrc*`

## Coding Standards (follow these)

- **TypeScript:** no `any` unless justified; prefer explicit return types on exported functions.
- **React / Next.js:** favour server components; add `"use client"` only when required. Keep components small and accessible (ARIA, keyboard support).
- **Styling:** Tailwind first; use shadcn/ui; avoid ad-hoc inline styles; keep class lists readable.
- **State & Data:** use Convex for server data; do not fetch from server endpoints that duplicate Convex logic.
- **Security:** never log or hardcode secrets; validate inputs at server boundaries; follow least privilege.
- **Tests:** write/adjust unit tests near changed code; prefer RTL for UI; mock network/Convex where needed; use stable queries (`getByRole`, `getByLabelText`) not brittle selectors.
- **Errors:** fail fast with helpful messages; do not swallow errors silently.

## PR & CI Expectations

- PRs should pass **Format / check-on-pr**, **Quality / lint**, **Quality / typecheck**, **Quality / test**, **Quality / build**, **CodeQL / analyze**, **Semgrep / semgrep**.
- Keep diffs small and coherent; include migration notes when touching Convex schema.
- Commit style: `feat|fix|chore|refactor|docs|test: short imperative`.

## AI Review Labels

- `ai-review` → cheap review (OpenAI gpt-4o-mini; diff-only; capped files/size).
- `ai-deep` → deeper pass (OpenAI gpt-4o).
- `ai-ultra` → rare, summary-only narrative (Anthropic Claude 3.5 Sonnet).
  Prefer summaries over many inline comments to reduce token usage.

## Do / Don’t (quick)

- ✅ Do keep TS strict, accessible UI, and deterministic tests.
- ✅ Do update or add tests when behaviour changes.
- ❌ Don’t introduce new build tools or scripts without updating this file and CI.
- ❌ Don’t expand scope of a PR to unrelated areas.

> If content in this file conflicts with discovered scripts or docs, trust this file first; otherwise, search the repo.
