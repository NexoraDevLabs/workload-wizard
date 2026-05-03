# Advanced Scripts

These commands used to live in `package.json`. They are kept here for occasional operations without making the default script list noisy.

## Build and Analysis

```sh
ANALYZE=true pnpm build
```

```sh
pnpm dlx pnpm@10.15.0 doctor || true
```

```sh
pnpm update --latest --recursive
```

```sh
rimraf node_modules .next dist coverage && pnpm store prune
pnpm install
pnpm check
```

## Benchmarks

```sh
node scripts/bench/convex-listing-bench.mjs
```

## CSP

```sh
echo 'CSP_MODE=report-only' > .env.csp && echo 'CSP mode set to report-only'
```

```sh
echo 'CSP_MODE=enforce' > .env.csp && echo 'CSP mode set to enforce'
```

```sh
node scripts/csp-check.mjs
```

## Logging Checks

```sh
node scripts/verify-no-console.mjs
```

## Sentry

```sh
pnpm exec tsx scripts/sentry/createDashboards.ts
```

```sh
pnpm exec tsx scripts/sentry/createAlerts.ts
```

## Commit and Hook Helpers

```sh
pnpm typecheck && pnpm lint && pnpm test
```

```sh
pnpm exec czg
```

```sh
pnpm exec commitlint --edit "$1"
```

```sh
pnpm exec husky
```

```sh
pnpm exec husky install
```

```sh
pnpm exec husky add
```
