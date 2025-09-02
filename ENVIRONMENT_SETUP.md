# Environment Variable Setup

This project uses a priority-based environment loading system that checks files in this order:

1. `.env.dev.local` (highest priority - development)
2. `.env.prod.local` (fallback - production)
3. `.env.local` (general local overrides)
4. `.env` (default/committed values)

## Quick Setup

1. Copy the example files:

   ```bash
   cp env-dev-local.example .env.dev.local
   cp env-prod-local.example .env.prod.local
   ```

2. Edit the values in your `.env.dev.local` file for development

## How It Works

- **Development**: Create `.env.dev.local` with your local dev settings
- **Production**: If `.env.dev.local` doesn't exist, it falls back to `.env.prod.local`
- **Automatic Loading**: Environment variables are loaded automatically when Next.js starts
- **Client Access**: Use the `useEnvironment()` hook for client-side access to public variables

## Usage in Code

### Server-side

```javascript
// In API routes, middleware, or server components
console.log(process.env.DATABASE_URL);
```

### Client-side

```javascript
// In client components
import { useEnvironment } from '@/hooks/useEnvironment';

function MyComponent() {
  const { envVars, loadedFrom } = useEnvironment();

  return (
    <div>
      <p>API URL: {envVars.NEXT_PUBLIC_API_URL}</p>
      <p>Loaded from: {loadedFrom}</p>
    </div>
  );
}
```

### Server-side in components

```javascript
// In server components or getServerSideProps
import { getServerEnvironment } from '@/hooks/useEnvironment';

const envData = getServerEnvironment();
console.log('Environment loaded from:', envData.file);
```

## Security Notes

- Only variables prefixed with `NEXT_PUBLIC_` are exposed to the client
- All `.env.*` files are in `.gitignore` and won't be committed
- Use example files for sharing configuration structure
