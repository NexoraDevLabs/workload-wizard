import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const BodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  organisation: z.string().optional(),
  source: z.string().optional(),
});

interface ResendContact {
  email?: string;
}

interface ResendContactList {
  data?: ResendContact[];
}

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, organisation, source } =
      BodySchema.parse(await req.json());

    // Do not actually send in E2E runs
    if (process.env.NEXT_PUBLIC_E2E === 'true') {
      return NextResponse.json({ ok: true, e2e: true });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';

    if (!RESEND_API_KEY) {
      // RESEND_API_KEY not configured
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    if (!RESEND_AUDIENCE_ID) {
      // RESEND_NEWSLETTER_AUDIENCE_ID not configured
      return NextResponse.json(
        { error: 'Newsletter audience not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    // Check for existing contact to avoid duplicates
    try {
      const list = await resend.contacts.list({
        audienceId: RESEND_AUDIENCE_ID,
      });
      // Type assertion with proper error handling
      const contactList = list as unknown as ResendContactList;
      const alreadyExists = Array.isArray(contactList?.data)
        ? (contactList.data?.some(
            (c: ResendContact) =>
              String(c?.email || '').toLowerCase() === email.toLowerCase()
          ) ?? false)
        : false;
      if (alreadyExists) {
        return NextResponse.json({ ok: true, already: true });
      }
    } catch {
      // Resend contacts.list failed
    }

    // Add to Resend Audience contacts
    const basePayload: {
      audienceId: string;
      email: string;
      firstName: string;
      unsubscribed: boolean;
      lastName?: string;
    } = {
      audienceId: RESEND_AUDIENCE_ID,
      email,
      firstName,
      unsubscribed: false,
    };

    if (lastName && lastName.trim()) {
      basePayload.lastName = lastName.trim();
    }

    // Add tags for segmentation
    const withTags = {
      ...basePayload,
      tags: ['newsletter'],
    } as typeof basePayload & { tags: string[] };
    if (source && source.trim()) withTags.tags.push(`source:${source}`);
    if (organisation && organisation.trim())
      withTags.tags.push(`org:${organisation.trim()}`);

    try {
      await resend.contacts.create(withTags);
    } catch {
      return NextResponse.json(
        { error: 'Failed to subscribe to newsletter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Newsletter subscription error
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
