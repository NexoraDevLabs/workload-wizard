# Contributing to WorkloadWizard

Thanks for contributing! To keep things consistent, please follow the guidelines below.

## 🔀 Branching

- `main` → stable production branch
- `dev` → active development branch
- `feature/*` → new features
- `fix/*` → bug fixes
- `chore/*` → non-functional updates (docs, config, CI)

## 💬 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` → a new feature
- `fix:` → a bug fix
- `docs:` → documentation only
- `chore:` → tooling/config updates
- `test:` → adding or fixing tests

Examples:

```
feat: add workload summary dashboard
fix: correct FTE calculation for part-time staff
docs: update simulation booking workflow
```

## 📦 Pull Requests

1. Branch off `dev`.
2. Keep commits small and focused.
3. Run linting and tests before opening a PR:

   ```bash
   pnpm lint && pnpm test
   ```

4. Open a **draft PR** early for visibility.
5. PR must pass CI before merge.

## 📝 Code Style

- 2-space indentation
- Prettier for formatting
- ESLint for linting
- TypeScript strict mode
