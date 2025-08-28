import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { sendWaitlistWelcomeEmail } from "@/lib/services/emailService";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const BodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  source: z.string().optional(),
  organisation: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { email, name, source, organisation } = BodySchema.parse(
      await req.json(),
    );

    // Do not actually send in E2E runs
    if (process.env.NEXT_PUBLIC_E2E === "true") {
      return NextResponse.json({ ok: true, e2e: true });
    }

    // Fast de-dupe via Convex table first - do this before any Resend calls
    let existingWaitlistEntry = null;
    try {
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      existingWaitlistEntry = await convex.query(api.waitlist.getByEmail, {
        email,
      });
      if (existingWaitlistEntry) {
        return NextResponse.json({ ok: true, already: true });
      }
    } catch (e) {
      // Convex waitlist check failed
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || ""; // Optional: add contacts to Resend Audience
    const RESEND_AUDIENCE_NAME = process.env.RESEND_AUDIENCE_NAME || ""; // Optional fallback by name

    if (!RESEND_API_KEY) {
      // RESEND_API_KEY not configured
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    // Only check Resend audience if we don't have a Convex entry
    if (RESEND_AUDIENCE_ID && !existingWaitlistEntry) {
      // Check for existing contact to avoid duplicate emails/entries
      try {
        const list = await resend.contacts.list({
          audienceId: RESEND_AUDIENCE_ID,
        } as any);
        const alreadyExists = Array.isArray((list as any)?.data)
          ? ((list as any).data as any[]).some(
              (c: any) =>
                String(c?.email || "").toLowerCase() === email.toLowerCase(),
            )
          : false;
        if (alreadyExists) {
          // Do not send welcome email again; report status to client
          return NextResponse.json({ ok: true, already: true });
        }
      } catch {
        // If listing fails, proceed to attempt create below
        // Resend contacts.list failed
      }
    }

    // Best-effort: add to Resend Audience contacts if configured
    // If no ID but we have a name, try to find it
    if (!RESEND_AUDIENCE_ID && RESEND_AUDIENCE_NAME) {
      // Skip this to avoid extra API call - just use the name as a fallback
    }

    if (RESEND_AUDIENCE_ID && !existingWaitlistEntry) {
      // Build base payload for contact creation
      const basePayload: any = {
        audienceId: RESEND_AUDIENCE_ID,
        email,
        unsubscribed: false,
      };
      if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        basePayload.firstName = parts[0];
        const last = parts.slice(1).join(" ") || undefined;
        if (last) basePayload.lastName = last;
      }
      // Try with tags if supported
      const withTags = { ...basePayload };
      const tags: string[] = ["waitlist"];
      if (source && source.trim()) tags.push(`source:${source}`);
      if (organisation && organisation.trim())
        tags.push(`org:${organisation.trim()}`);
      (withTags as any).tags = tags;
      try {
        await resend.contacts.create(withTags);
      } catch (e: any) {
        // Retry without tags if API rejects unknown field
        try {
          await resend.contacts.create(basePayload);
        } catch {
          // Resend contacts.create failed
        }
      }
    }

    // Persist to Convex waitlist (best-effort)
    try {
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      const payload: {
        email: string;
        name?: string;
        organisation?: string;
        source?: string;
      } = { email };
      if (name !== undefined) payload.name = name;
      if (organisation !== undefined) payload.organisation = organisation;
      if (source !== undefined) payload.source = source;
      await convex.mutation(api.waitlist.upsert, payload);
    } catch {
      // Convex waitlist upsert failed
    }

    // Send a friendly welcome email to the user (best-effort)
    // Only send if we don't already have a waitlist entry
    if (!existingWaitlistEntry) {
      try {
        // Add a small delay to avoid rate limiting after audience operations
        await new Promise((resolve) => setTimeout(resolve, 600)); // 600ms delay
        await sendWaitlistWelcomeEmail({ to: email, name });
      } catch {
        // Failed to send welcome email
        return NextResponse.json(
          { error: "Failed to send welcome email" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Failed to add to waitlist
    return NextResponse.json(
      { error: "Failed to add to waitlist" },
      { status: 500 },
    );
  }
}
