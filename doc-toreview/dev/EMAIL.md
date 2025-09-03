<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of contents

- [Email Integration (Provider Agnostic)](#email-integration-provider-agnostic)
  - [Overview](#overview)
  - [Required environment variables](#required-environment-variables)
  - [Implementing a provider](#implementing-a-provider)
  - [Environment notes (URL resolution)](#environment-notes-url-resolution)
  - [URL consistency and Resend warning](#url-consistency-and-resend-warning)
  - [Newsletter Subscription](#newsletter-subscription)
    - [Setup](#setup)
    - [Usage](#usage)
  - [Testing](#testing)
  - [Security](#security)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Email Integration (Provider Agnostic)

This is the canonical email guide for `workload-wizard-app`.

## Overview

- Provider-agnostic service at `src/lib/services/emailService.ts`
- Uses environment variables for sender and URLs
- Invitation emails with temporary passwords

## Required environment variables

```bash
# Core email
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=system@workload-wiz.xyz

# App URLs
NEXT_PUBLIC_APP_URL=https://workload-wiz.xyz
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://workload-wiz.xyz/sign-in
NEXT_PUBLIC_DASHBOARD_URL=https://workload-wiz.xyz/dashboard

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your_convex_url.convex.cloud
```

See the Environment notes below for URL resolution and fallbacks.

## Implementing a provider

Edit `src/lib/services/emailService.ts` and plug your provider (Resend recommended). Example Resend implementation excerpt:

```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendUserInvitationEmail(
  data: UserInvitationEmailData
): Promise<EmailResult> {
  const result = await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: data.to,
    subject: 'Welcome to WorkloadWizard - Your Account Details',
    html: generateInvitationEmailHTML(data),
    text: generateInvitationEmailText(data),
  });
  return { success: true, messageId: result.data?.id };
}
```

## Environment notes (URL resolution)

- Prefer `NEXT_PUBLIC_APP_URL` as base
- If missing, derive from `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- If still missing, derive from `FROM_EMAIL` domain
- Dev fallback to `http://localhost:3000`

## URL consistency and Resend warning

All URLs in templates are resolved to absolute URLs matching your domain. If you see mismatch warnings, ensure `FROM_EMAIL`’s domain matches your app domain and that `NEXT_PUBLIC_CLERK_SIGN_IN_URL` points at the correct host.

## Newsletter Subscription

The app includes a newsletter subscription system that integrates with Resend Audiences (which can sync to Mailchimp):

- **Component**: `src/components/NewsletterSubscription.tsx`
- **API**: `src/app/api/newsletter/route.ts`
- **Integration**: Adds contacts to Resend Audience with tags for segmentation
- **Features**: Duplicate prevention, source tracking, organisation tagging

### Setup

1. The newsletter subscription uses the same Resend Audience as the waitlist (`RESEND_AUDIENCE_ID`)
2. No additional environment variables needed
3. The component is integrated in blog pages for newsletter signups

### Usage

```tsx
import NewsletterSubscription from "@/components/NewsletterSubscription"

// Basic usage
<NewsletterSubscription />

// Custom trigger and source
<NewsletterSubscription
  source="landing-page"
  trigger={<Button>Custom Button</Button>}
/>
```

## Testing

- Use your admin panel flows or add a small script calling `sendTestEmail()`
- Verify delivery in provider dashboard
- Ensure links point to your app domain
- Test newsletter subscription via the header button

## Security

- Never commit API keys
- Verify sender domain (SPF/DKIM) for deliverability
- Temporary passwords must be rotated on first login
