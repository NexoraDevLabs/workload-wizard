# Advanced Scripts

These commands used to live in `package.json`. They are kept here for occasional operations without making the default script list noisy.

## Build and Analysis

```sh
ANALYZE=true npm run build
```

```sh
npx npm@10.15.0 doctor || true
```

```sh
npm update --latest --recursive
```

```sh
rimraf node_modules .next dist coverage && npm store prune
npm install
npm run check
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

```sh

```

```sh

```

## Commit and Hook Helpers

```sh
npm run typecheck && npm run lint && npm test
```

```sh
npx czg
```

```sh
npx commitlint --edit "$1"
```

```sh
npx husky
```

```sh
npx husky install
```

```sh
npx husky add
```
