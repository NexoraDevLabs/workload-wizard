import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().optional(),
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
    const { email, firstName, lastName, source, organisation } =
      BodySchema.parse(await req.json());

    if (process.env.NEXT_PUBLIC_E2E === 'true') {
      return NextResponse.json({ ok: true, e2e: true });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const blogTopicId = process.env.RESEND_NEWSLETTER_TOPIC_ID;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    if (!blogTopicId) {
      return NextResponse.json(
        { error: 'Blog topic is not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const companyName = organisation?.trim();

    const properties: Record<string, string> = {
      blog_updates: 'true',
    };

    if (companyName) {
      properties.company_name = companyName;
    }

    if (source) {
      properties.blog_signup_source = source;
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

    let alreadySubscribed = false;

    try {
      await resend.contacts.create(contactPayload);
    } catch (error) {
      if (!isDuplicateContactError(error)) {
        return NextResponse.json(
          { error: 'Failed to create blog subscription contact' },
          { status: 500 }
        );
      }

      alreadySubscribed = true;

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
          { error: 'Failed to update blog subscription contact' },
          { status: 502 }
        );
      }
    }

    try {
      await optInContactToTopic({
        resend,
        email,
        topicId: blogTopicId,
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to subscribe contact to Blog topic' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      already: alreadySubscribed,
      topicSubscribed: true,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to subscribe to blog updates' },
      { status: 500 }
    );
  }
}