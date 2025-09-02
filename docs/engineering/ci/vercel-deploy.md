# Vercel CLI Deployment

This document outlines how our GitHub Actions workflow deploys the Next.js application to Vercel using the Vercel CLI for both development and production environments.

## Overview

The `vercel-deploy.yml` workflow provides automated deployments to Vercel with the following features:

- **Preview deployments** for pull requests and development branch pushes
- **Production deployments** for main branch pushes and version tags
- **Nexoroid GitHub App integration** for automated comments and commits
- **Caching optimizations** for fast, reliable builds
- **Job summaries** with deployment details and links

## Deployment Triggers

### Preview Deployments

- Pull requests targeting `dev` or `main` branches
- Direct pushes to the `dev` branch

### Production Deployments

- Direct pushes to the `main` branch
- Git tags matching the pattern `v*` (e.g., `v1.0.0`, `v2.1.3`)

## Required Secrets

The workflow requires the following repository secrets to be configured:

### Vercel Secrets

- `VERCEL_TOKEN` - Vercel authentication token with deployment permissions
- `VERCEL_ORG_ID` - Your Vercel organization/team ID
- `VERCEL_PROJECT_ID` - The project ID for your Vercel application

### Convex Secrets

- `CONVEX_DEPLOY_KEY_DEV` - Convex deploy key for dev/preview deployments
- `CONVEX_DEPLOY_KEY_PROD` - Convex deploy key for production deployments

### Nexoroid GitHub App Secrets

- `NEXOROID_APP_ID` - GitHub App ID for the Nexoroid bot
- `NEXOROID_APP_PRIVATE_KEY` - Private key for GitHub App authentication

## Token Management

### Rotating Vercel Token

1. Go to [Vercel Dashboard > Settings > Tokens](https://vercel.com/account/tokens)
2. Create a new token with appropriate scope
3. Update the `VERCEL_TOKEN` secret in GitHub repository settings
4. Delete the old token from Vercel

### Rotating Convex Deploy Keys

1. Go to [Convex Dashboard > Settings](https://dashboard.convex.dev)
2. Generate new deploy keys:
   - **Dev/Preview**: Generate a new "Preview" deploy key
   - **Production**: Generate a new "Production" deploy key
3. Update the corresponding secrets in GitHub repository settings:
   - `CONVEX_DEPLOY_KEY_DEV` for preview deployments
   - `CONVEX_DEPLOY_KEY_PROD` for production deployments
4. Delete the old deploy keys from Convex dashboard

### Rotating GitHub App Private Key

1. Navigate to your GitHub App settings
2. Generate a new private key
3. Update the `NEXOROID_APP_PRIVATE_KEY` secret in repository settings
4. Remove the old private key file

## Workflow Features

### Performance Optimizations

- **pnpm caching** - Dependencies are cached between runs
- **Next.js build cache** - Build artifacts are cached for faster subsequent builds
- **Concurrency control** - Cancels redundant runs per git reference
- **Convex integration** - Automatically deploys Convex functions with each deployment
- **Environment-specific databases** - Uses dev Convex for previews, prod Convex for production

### Automated Communication

- **Sticky PR comments** - Updates existing comment on subsequent runs
- **Job summaries** - Detailed deployment information in workflow run summary
- **Nexoroid identity** - All comments and commits use the Nexoroid GitHub App

## Troubleshooting

### Common Vercel CLI Errors

#### Authentication Errors

```
Error: No token found. Please run `vercel login` or set the `VERCEL_TOKEN` environment variable.
```

**Solution:** Verify `VERCEL_TOKEN` secret is set and valid.

#### Project Not Found

```
Error: Project not found
```

**Solution:** Check that `VERCEL_PROJECT_ID` matches your actual project ID in Vercel dashboard.

#### Organization Access

```
Error: You don't have access to this team/organization
```

**Solution:** Ensure `VERCEL_ORG_ID` is correct and the token has appropriate team permissions.

#### Rate Limiting

```
Error: Rate limit exceeded
```

**Solution:** Wait for rate limit to reset or contact Vercel support for increased limits.

### GitHub App Issues

#### Token Generation Failure

```
Error: Could not create installation access token
```

**Solution:** Verify `NEXOROID_APP_ID` and `NEXOROID_APP_PRIVATE_KEY` are correct and the app is installed on the repository.

#### Permission Denied

```
Error: Resource not accessible by integration
```

**Solution:** Check GitHub App permissions include `contents: write`, `pull-requests: write`, and `deployments: write`.

### Build Failures

#### Next.js Build Errors

- Check build logs in the "Build (Vercel prebuilt)" step
- Verify environment variables are properly configured in Vercel
- Ensure all dependencies are listed in `package.json`

#### Cache Issues

- Clear Next.js cache by updating cache key in workflow
- Check if dependency changes require cache invalidation

## Workflow Outputs

### PR Comments

For pull requests, the workflow posts a sticky comment with:

- Deployment URL
- Environment type (preview)
- Commit SHA
- Auto-updates on subsequent runs

### Job Summary

Every workflow run includes a summary card with:

- Environment (preview/production)
- Git reference and commit
- Deployment URL
- Workflow run number

## Environment Configuration

The workflow automatically determines the deployment environment:

```bash
# Preview environment triggers
- Pull requests to dev/main
- Pushes to dev branch

# Production environment triggers
- Pushes to main branch
- Git tags starting with 'v'
```

## Security Considerations

- All secrets are stored securely in GitHub repository settings
- Vercel tokens should have minimal required permissions
- GitHub App private keys are never logged or exposed
- Environment variables are only available during workflow execution

## Monitoring

Monitor deployment status through:

- GitHub Actions workflow runs
- Vercel dashboard deployment logs
- PR comments with deployment links
- Workflow job summaries
