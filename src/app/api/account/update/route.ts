import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { WorkOS } from '@workos-inc/node';

import { api } from '@/convex/_generated/api';
import { getAuthUserFromWorkOS } from '@/lib/auth/workos';

let convexClient: ConvexHttpClient | null = null;

function getConvexClient() {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    convexClient = new ConvexHttpClient(url);
  }

  return convexClient;
}

const workosApiKey = process.env.WORKOS_API_KEY;
const workosClientId = process.env.WORKOS_CLIENT_ID;

if (!workosApiKey) {
  throw new Error('WORKOS_API_KEY is not configured');
}

if (!workosClientId) {
  throw new Error('WORKOS_CLIENT_ID is not configured');
}

const workos = new WorkOS(workosApiKey, {
  clientId: workosClientId,
});

type AccountUpdateBody = {
  givenName?: string;
  familyName?: string;
  username?: string;
  email?: string;
  pictureUrl?: string;
};

function normaliseString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normaliseUsername(value: unknown) {
  return normaliseString(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normaliseMetadataValue(value: string) {
    return [...value]
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code >= 32 && code <= 126;
      })
      .join('')
      .slice(0, 600);
  }

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromWorkOS();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = (await request.json()) as AccountUpdateBody;

    const givenName = normaliseString(body.givenName);
    const familyName = normaliseString(body.familyName);
    const username = normaliseUsername(body.username);
    const email = normaliseString(body.email).toLowerCase();
    const pictureUrl = normaliseString(body.pictureUrl);

    if (!givenName) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    /*
      Duplicate username check:
      Put the actual duplicate logic in convex/users.ts inside updateOwnAccount.
      If duplicate, throw: new Error('Username is already taken')
      This route catches that and returns 409.
    */
      const updatedUser = await getConvexClient().mutation(
        api.users.updateOwnAccount,
        {
          subject: authUser.id,
          givenName,
          familyName,
          username,
          email,
        }
      );

    /*
      WorkOS:
      - firstName / lastName / email are identity fields
      - username is app data, so store as metadata
      - externalId should be a stable internal ID, not username
      - profile picture can be stored as metadata if you want WorkOS to know about it
    */
    await workos.userManagement.updateUser({
      userId: authUser.id,
      firstName: givenName,
      lastName: familyName,
      email,
      ...(updatedUser?._id ? { externalId: String(updatedUser._id) } : {}),
      metadata: {
        username: normaliseMetadataValue(username),
        ...(pictureUrl
          ? { profile_picture_url: normaliseMetadataValue(pictureUrl) }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update account';

    if (message.toLowerCase().includes('username is already taken')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.toLowerCase().includes('email address is already in use')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}