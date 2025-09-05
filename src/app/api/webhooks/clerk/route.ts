import { Webhook } from 'svix';
import { headers } from 'next/headers';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { logger } from '@/lib/logger';
import { withApiTracing } from '@/lib/otel/withApiTracing';
import { withDbSpan } from '@/lib/otel/withDbSpan';

// Define proper types for Statsig adapter
interface StatsigAdapter {
  initialize: () => Promise<{
    logEvent: (
      event: Record<string, unknown>,
      eventName: string
    ) => Promise<void>;
    flush: () => Promise<void>;
  }>;
}

// Type guard to ensure adapter has required methods
function isValidStatsigAdapter(adapter: unknown): adapter is StatsigAdapter {
  return (
    adapter !== null &&
    typeof adapter === 'object' &&
    'initialize' in adapter &&
    typeof (adapter as Record<string, unknown>).initialize === 'function'
  );
}

// Lazy import to avoid build-time issues
let statsigAdapter: StatsigAdapter | null = null;
async function getStatsigAdapter(): Promise<StatsigAdapter | null> {
  if (!statsigAdapter) {
    try {
      const { statsigAdapter: adapter } = await import('@/flags');
      if (isValidStatsigAdapter(adapter)) {
        statsigAdapter = adapter;
      }
    } catch {
      // If import fails, return null
      return null;
    }
  }
  return statsigAdapter;
}

// Lazy client creation to avoid build-time issues
let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

async function handlePost(req: Request) {
  // Webhook received

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    // CLERK_WEBHOOK_SECRET not found in environment variables
    return new Response('Webhook secret not configured', {
      status: 500,
    });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // Webhook headers logged

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    // Missing svix headers
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = (await req.json()) as Record<string, unknown>;
  const body = JSON.stringify(payload);

  // Webhook payload type logged

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
    // Webhook verified successfully
  } catch {
    // Error verifying webhook
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  // Processing webhook event
  // Event data keys logged

  try {
    switch (eventType) {
      case 'user.created':
        // Handling user.created
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        // Handling user.updated
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        // Handling user.deleted
        await handleUserDeleted(evt.data);
        break;
      case 'session.created':
        // Handling session.created - THIS IS FOR LOGIN TRACKING!
        await handleSessionCreated(evt.data);
        break;
      default:
      // Unhandled webhook event
    }
    // Webhook processed successfully
  } catch {
    // Error handling webhook
    return new Response('Error processing webhook', { status: 500 });
  }

  return new Response('Webhook processed successfully', { status: 200 });
}

export const POST = withApiTracing('api:/api/webhooks/clerk', handlePost);

interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string;
  public_metadata?: {
    roles?: string[];
    role?: string;
    organisationId?: string;
  };
}

interface DeletedUserData {
  id?: string;
}

interface UserCreatePayload {
  email: string;
  username: string;
  givenName: string;
  familyName: string;
  fullName: string;
  systemRoles: string[];
  pictureUrl: string;
  subject: string;
  tokenIdentifier: string;
  organisationId?: Id<'organisations'>;
}

interface UserUpdatePayload {
  userId: string;
  email: string;
  username: string;
  givenName: string;
  familyName: string;
  fullName: string;
  systemRoles: string[];
  pictureUrl: string;
  organisationId?: Id<'organisations'>;
}

async function handleUserCreated(userData: ClerkUserData) {
  // Handling user.created event for user

  const emailAddresses = (userData.email_addresses || []) as Array<{
    email_address: string;
    id: string;
  }>;
  const primaryEmail = emailAddresses.find(
    (email) => email.id === (userData.primary_email_address_id || undefined)
  );

  if (!primaryEmail) {
    // No primary email found for user
    return;
  }

  // Set default values if metadata is missing
  const publicMetadata =
    (userData.public_metadata as Record<string, unknown>) || {};
  const roles =
    (publicMetadata.roles as string[] | undefined) ??
    ((publicMetadata.role as string | undefined)
      ? [publicMetadata.role as string]
      : ['user']);
  const organisationId = (publicMetadata.organisationId as string) || '';

  // Creating user in Convex

  // Create user in Convex
  const createPayload: UserCreatePayload = {
    email: primaryEmail.email_address,
    username: (userData as unknown as { username?: string }).username || '',
    givenName: (userData.first_name as string) || '',
    familyName: (userData.last_name as string) || '',
    fullName:
      `${(userData.first_name as string) || ''} ${(userData.last_name as string) || ''}`.trim(),
    systemRoles: roles,
    pictureUrl: userData.image_url as string,
    subject: userData.id,
    tokenIdentifier: primaryEmail.id,
  };

  // Only add organisationId if it's a valid non-empty string
  if (organisationId && organisationId.trim() !== '') {
    // Convert string to Convex ID type - this is safe for webhook data
    createPayload.organisationId = organisationId as Id<'organisations'>;
  }

  await withDbSpan('convex:createUser', () =>
    getConvexClient().mutation(api.users.create, createPayload)
  );

  // User created in Convex

  // Also create the user in Statsig Users by logging an event
  try {
    const adapter = await getStatsigAdapter();
    if (adapter && typeof adapter === 'object' && 'initialize' in adapter) {
      const Statsig = await adapter.initialize();
      if (
        Statsig &&
        typeof Statsig === 'object' &&
        'logEvent' in Statsig &&
        'flush' in Statsig
      ) {
        await Statsig.logEvent(
          {
            userID: userData.id,
            email: primaryEmail.email_address,
            custom: {
              fullName:
                `${(userData.first_name as string) || ''} ${(userData.last_name as string) || ''}`.trim(),
              organisationId,
              roles,
              source: 'clerk.webhook',
            },
          },
          'user_created'
        );
        await Statsig.flush();
      }
    }
  } catch {
    // Log error but don't fail the webhook
    logger.error('Failed to create user in Statsig: Unknown error');
  }
}

async function handleUserUpdated(userData: ClerkUserData) {
  // Handling user.updated event for user

  const emailAddresses = (userData.email_addresses || []) as Array<{
    email_address: string;
    id: string;
  }>;
  const primaryEmail = emailAddresses.find(
    (email) => email.id === (userData.primary_email_address_id || undefined)
  );

  const publicMetadata =
    (userData.public_metadata as Record<string, unknown>) || {};

  // Update user in Convex using webhook-specific mutation
  const updatePayload: UserUpdatePayload = {
    userId: userData.id,
    email: primaryEmail?.email_address as string,
    username: (userData as unknown as { username?: string }).username || '',
    givenName: userData.first_name as string,
    familyName: userData.last_name as string,
    fullName:
      `${(userData.first_name as string) || ''} ${(userData.last_name as string) || ''}`.trim(),
    systemRoles:
      (publicMetadata.roles as string[]) ??
      ((publicMetadata.role as string | undefined)
        ? [publicMetadata.role as string]
        : []),
    pictureUrl: userData.image_url as string,
  };

  if (publicMetadata.organisationId) {
    updatePayload.organisationId =
      publicMetadata.organisationId as Id<'organisations'>;
  }

  await withDbSpan('convex:updateUserByWebhook', () =>
    getConvexClient().mutation(api.users.updateByWebhook, updatePayload)
  );

  // User updated in Convex

  // Mirror update to Statsig
  const adapter = await getStatsigAdapter();
  if (
    adapter &&
    typeof adapter === 'object' &&
    adapter !== null &&
    'initialize' in adapter
  ) {
    try {
      const Statsig = await adapter.initialize();
      if (
        Statsig &&
        typeof Statsig === 'object' &&
        'logEvent' in Statsig &&
        'flush' in Statsig
      ) {
        await Statsig.logEvent(
          {
            userID: userData.id,
            email: primaryEmail?.email_address as string,
            custom: {
              fullName:
                `${(userData.first_name as string) || ''} ${(userData.last_name as string) || ''}`.trim(),
              organisationId:
                (publicMetadata.organisationId as string) || undefined,
              roles:
                (publicMetadata.roles as string[]) ||
                ((publicMetadata.role as string | undefined)
                  ? [publicMetadata.role as string]
                  : []),
              source: 'clerk.webhook',
            },
          },
          'user_updated'
        );
        await Statsig.flush();
      }
    } catch {
      // Log error but don't fail the webhook
      logger.error('Failed to update Statsig: Unknown error');
    }
  }
}

async function handleUserDeleted(userData: DeletedUserData) {
  // Handling user.deleted event for user

  // Soft delete user in Convex
  if (userData.id) {
    await withDbSpan('convex:removeUser', () =>
      getConvexClient().mutation(api.users.remove, {
        userId: userData.id as string,
      })
    );
  }

  // User deleted from Convex
}

interface SessionData {
  user_id?: string;
}

async function handleSessionCreated(sessionData: unknown) {
  const s = sessionData as SessionData;
  // Handling session.created event for user
  // Session data logged

  // Update last sign in time in Convex
  await withDbSpan('convex:updateLastSignIn', () =>
    getConvexClient().mutation(api.users.updateLastSignIn, {
      userId: s.user_id as string,
    })
  );

  // Last sign in time updated in Convex for user

  // Log a login event to Statsig to ensure the user appears in Users
  const adapter = await getStatsigAdapter();
  if (
    adapter &&
    typeof adapter === 'object' &&
    adapter !== null &&
    'initialize' in adapter
  ) {
    const Statsig = await (
      adapter as {
        initialize(): Promise<{
          logEvent: (event: unknown, name: string) => Promise<void>;
          flush: () => Promise<void>;
        }>;
      }
    ).initialize();
    await Statsig.logEvent(
      { userID: (s.user_id as string) || 'unknown' },
      'login'
    );
    await Statsig.flush();
  }
}
