import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { sendWaitlistWelcomeEmail } from '@/lib/services/emailService';

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().optional(),
  name: z.string().trim().min(1).optional(),
  source: z.string().trim().optional(),
  organisation: z.string().trim().optional(),
});

type ResendContactPayload = {
  email: string;
  firstName: string;
  lastName?: string;
  unsubscribed?: boolean;
  properties?: Record<string, string>;
};

type ResendContactUpdatePayload = {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
  properties?: Record<string, string>;
};

function isDuplicateContactError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return (
    message.includes('already exists') ||
    message.includes('duplicate') ||
    message.includes('already exist')
  );
}

async function addContactToWaitlistSegment(params: {
  apiKey: string;
  email: string;
  segmentId: string;
}) {
  const response = await fetch(
    `https://api.resend.com/contacts/${encodeURIComponent(
      params.email
    )}/segments/${encodeURIComponent(params.segmentId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add contact to Resend segment');
  }
}

async function optInContactToTopic(params: {
  resend: Resend;
  email: string;
  topicId: string;
}) {
  await params.resend.contacts.topics.update({
    email: params.email,
    topics: [
      {
        id: params.topicId,
        subscription: 'opt_in',
      },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, name, source, organisation } =
      BodySchema.parse(await req.json());

    if (process.env.NEXT_PUBLIC_E2E === 'true') {
      return NextResponse.json({ ok: true, e2e: true });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const waitlistSegmentId = process.env.RESEND_WAITLIST_SEGMENT_ID;
    const newReleaseTopicId = process.env.RESEND_NEW_RELEASE_TOPIC_ID;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    if (!waitlistSegmentId) {
      return NextResponse.json(
        { error: 'Waitlist segment is not configured' },
        { status: 500 }
      );
    }

    let alreadyOnWaitlist = false;

    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        const existingWaitlistEntry = await convex.query(
          api.waitlist.getByEmail,
          { email }
        );

        alreadyOnWaitlist = Boolean(existingWaitlistEntry);
      } catch {
        // Convex lookup is best-effort for this public signup endpoint.
      }
    }

    const resend = new Resend(resendApiKey);
    const companyName = organisation?.trim();
    const fullName = name ?? `${firstName} ${lastName ?? ''}`.trim();

    const properties: Record<string, string> = {
      waitlist: 'true',
    };

    if (companyName) {
      properties.company_name = companyName;
    }

    const contactPayload: ResendContactPayload = {
      email,
      firstName,
      unsubscribed: false,
      properties,
    };

    if (lastName) {
      contactPayload.lastName = lastName;
    }

    try {
      await resend.contacts.create(contactPayload);
    } catch (error) {
      if (!isDuplicateContactError(error)) {
        return NextResponse.json(
          { error: 'Failed to create waitlist contact' },
          { status: 500 }
        );
      }

      const updatePayload: ResendContactUpdatePayload = {
        email,
        firstName,
        unsubscribed: false,
        properties,
      };

      if (lastName) {
        updatePayload.lastName = lastName;
      }

      try {
        await resend.contacts.update(updatePayload);
      } catch {
        return NextResponse.json(
          { error: 'Failed to update waitlist contact' },
          { status: 502 }
        );
      }

      alreadyOnWaitlist = true;
    }

    try {
      await addContactToWaitlistSegment({
        apiKey: resendApiKey,
        email,
        segmentId: waitlistSegmentId,
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to add contact to waitlist segment' },
        { status: 502 }
      );
    }

    if (newReleaseTopicId) {
      try {
        await optInContactToTopic({
          resend,
          email,
          topicId: newReleaseTopicId,
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to subscribe contact to New Release topic' },
          { status: 502 }
        );
      }
    }

    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        const payload: {
          email: string;
          name?: string;
          organisation?: string;
          source?: string;
        } = { email };

        payload.name = fullName;

        if (organisation) {
          payload.organisation = organisation;
        }

        if (source) {
          payload.source = source;
        }

        await convex.mutation(api.waitlist.upsert, payload);
      } catch {
        // Convex upsert is best-effort for this public signup endpoint.
      }
    }

    if (!alreadyOnWaitlist) {
      const result = await sendWaitlistWelcomeEmail({
        to: email,
        name: fullName,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: 'Added to waitlist but failed to send welcome email' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      already: alreadyOnWaitlist,
      topicSubscribed: Boolean(newReleaseTopicId),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500 }
    );
  }
}