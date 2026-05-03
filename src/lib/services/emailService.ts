import { Resend } from 'resend';

// Initialize Resend with API key
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@workload-wiz.xyz';

// Email configuration from environment variables
const EMAIL_CONFIG = {
  // Base URL for the application
  BASE_URL:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL?.replace('/sign-in', '') ||
    'https://workload-wiz.xyz',

  // Sign-in URL
  SIGN_IN_URL:
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://workload-wiz.xyz/sign-in',

  // Dashboard URL
  DASHBOARD_URL:
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    'https://workload-wiz.xyz/dashboard',

  // Support email
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@workload-wiz.xyz',

  // Waitlist email
  WAITLIST_EMAIL: process.env.WAITLIST_EMAIL || 'sam@workload-wiz.xyz',

  // Company name
  COMPANY_NAME: process.env.COMPANY_NAME || 'WorkloadWizard',
  // Company address (optional footer line)
  COMPANY_ADDRESS: process.env.COMPANY_ADDRESS || '',

  // App name
  APP_NAME: process.env.APP_NAME || 'WorkloadWizard',
  // Featurebase public portal
  FEATUREBASE_URL:
    process.env.NEXT_PUBLIC_FEATUREBASE_PORTAL_URL ||
    'https://workloadwizard.featurebase.app',
};

// Get the base URL for emails - should match your sending domain
const getBaseUrl = () => {
  try {
    // Use environment variable if set, otherwise try to construct from FROM_EMAIL
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
      // Extract base URL from the sign-in URL
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      return `${url.protocol}//${url.host}`;
    }
  } catch {
    // Fallback to FROM_EMAIL domain
  }

  // If FROM_EMAIL is set, try to extract domain
  if (FROM_EMAIL && FROM_EMAIL.includes('@')) {
    const domain = FROM_EMAIL.split('@')[1];
    return `https://${domain}`;
  }

  // Fallback to localhost for development
  return 'http://localhost:3000';
};

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Generic email service interface
export interface UserInvitationEmailData {
  to: string;
  firstName: string;
  lastName: string;
  username: string;
  temporaryPassword: string;
  signInUrl: string;
  adminName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Resend email service implementation
export async function sendUserInvitationEmail(
  data: UserInvitationEmailData
): Promise<EmailResult> {
  // Disable outbound email in E2E runs to prevent side effects
  if (process.env.NEXT_PUBLIC_E2E === 'true') {
    return { success: true, messageId: 'e2e-disabled' };
  }
  if (!resend) {
    return { success: false, error: 'Resend not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: 'Welcome to WorkloadWizard - Your Account Details',
      html: generateInvitationEmailHTML(data),
      text: generateInvitationEmailText(data),
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: result.data?.id || 'unknown',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Email template generators (can be used with any email service)
export function generateInvitationEmailHTML(
  data: UserInvitationEmailData
): string {
  const baseUrl = getBaseUrl();
  const signInUrl = data.signInUrl.startsWith('http')
    ? data.signInUrl
    : `${baseUrl}${data.signInUrl}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${EMAIL_CONFIG.APP_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .credentials { background: #e0e7ff; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${EMAIL_CONFIG.APP_NAME}!</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${data.firstName} ${data.lastName},</h2>
          
          <p>Your account has been created by ${data.adminName || 'an administrator'}. Here are your login credentials:</p>
          
          <div class="credentials">
            <p><strong>Username:</strong> ${data.username}</p>
            <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
            <p><strong>Sign-in URL:</strong> <a href="${signInUrl}">${signInUrl}</a></p>
          </div>
          
          <div class="warning">
            <p><strong>Important:</strong> Please change your password immediately after your first login for security reasons.</p>
          </div>
          
          <p>To get started:</p>
          <ol>
            <li>Click the sign-in link above or copy it to your browser</li>
            <li>Enter your username and temporary password</li>
            <li>You'll be prompted to change your password</li>
            <li>Complete your profile setup</li>
          </ol>
          
          <a href="${signInUrl}" class="button">Sign In Now</a>
          
          <p>If you have any questions or need assistance, please contact your administrator or email us at <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}">${EMAIL_CONFIG.SUPPORT_EMAIL}</a>.</p>
          
          <p>Best regards,<br>The ${EMAIL_CONFIG.COMPANY_NAME} Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>If you didn't expect this email, please contact your administrator or email <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}">${EMAIL_CONFIG.SUPPORT_EMAIL}</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateInvitationEmailText(
  data: UserInvitationEmailData
): string {
  const baseUrl = getBaseUrl();
  const signInUrl = data.signInUrl.startsWith('http')
    ? data.signInUrl
    : `${baseUrl}${data.signInUrl}`;

  return `
Welcome to ${EMAIL_CONFIG.APP_NAME}!

Hello ${data.firstName} ${data.lastName},

Your account has been created by ${data.adminName || 'an administrator'}. Here are your login credentials:

Username: ${data.username}
Temporary Password: ${data.temporaryPassword}
Sign-in URL: ${signInUrl}

IMPORTANT: Please change your password immediately after your first login for security reasons.

To get started:
1. Copy the sign-in URL to your browser
2. Enter your username and temporary password
3. You'll be prompted to change your password
4. Complete your profile setup

If you have any questions or need assistance, please contact your administrator or email us at ${EMAIL_CONFIG.SUPPORT_EMAIL}.

Best regards,
The ${EMAIL_CONFIG.COMPANY_NAME} Team

---
This is an automated message. Please do not reply to this email.
If you didn't expect this email, please contact your administrator or email ${EMAIL_CONFIG.SUPPORT_EMAIL}.
  `;
}

// Waitlist welcome email
export interface WaitlistWelcomeData {
  to: string;
  name?: string | undefined;
}

export function generateWaitlistWelcomeEmailHTML(
  data: WaitlistWelcomeData
): string {
  const baseUrl = getBaseUrl();
  const featurebaseUrl = EMAIL_CONFIG.FEATUREBASE_URL;
  const roadmapUrl = `${featurebaseUrl}/roadmap`;
  const blogUrl = `${baseUrl}/blog`;
  const name = data.name?.trim();
  const firstName = name ? name.split(/\s+/)[0] : '';

  return `
<!DOCTYPE html>
<html lang="en" style="background:#f6f8fb;margin:0;padding:0;">
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to the ${EMAIL_CONFIG.APP_NAME} waitlist</title>
    <!--[if mso]>
      <style>
        * { font-family: Arial, sans-serif !important; }
      </style>
    <![endif]-->
    <style>
      body { margin:0; padding:0; width:100% !important; background:#f6f8fb; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
      table { border-collapse:collapse; }
      a { color:#0F59FF; text-decoration:none; }
      img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }

      .wrapper { width:100%; background:#f6f8fb; padding:24px 12px; }
      .container { max-width:640px; margin:0 auto; }
      .card { background:#ffffff; border-radius:16px; border:1px solid #e8ecf2; box-shadow:0 1px 3px rgba(16,24,40,.06); }

      .p-24 { padding:24px; }
      .p-32 { padding:32px; }
      .center { text-align:center; }
      .muted { color:#6b7280; }

      h1,h2,h3,p { margin:0; }
      h1 { font-size:24px; line-height:1.25; color:#0b1324; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      p  { font-size:16px; line-height:1.6; color:#111827; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      small { font-size:12px; color:#6b7280; }

      .logo-badge { width:56px; height:56px; border-radius:14px; background:#0F59FF; }

      .btn { display:inline-block; border-radius:10px; font-weight:600; padding:12px 18px; font-size:15px; }
      .btn-primary { background:#0F59FF; color:#ffffff !important; }
      .btn-secondary { background:#eef3ff; color:#0F59FF !important; }

      .footer { text-align:center; padding:18px; }

      @media (max-width: 600px) {
        .p-32 { padding:22px !important; }
        .stack { display:block !important; width:100% !important; }
        .cta td { display:block; width:100% !important; padding-bottom:10px !important; }
      }

      @media (prefers-color-scheme: dark) {
        body, .wrapper { background:#0b1324; }
        .card { background:#0f172a; border-color:#1e293b; }
        h1, p { color:#e5e7eb !important; }
        .muted, small { color:#94a3b8 !important; }
        .btn-secondary { background:#0a122a !important; color:#bcd5ff !important; }
      }
    </style>
  </head>

  <body style="margin:0; padding:0;">
    <table role="presentation" class="wrapper" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" class="container" width="100%" cellspacing="0" cellpadding="0">
            <!-- Card -->
            <tr>
              <td class="card">
                <!-- Header -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="p-24 center">
                      <table role="presentation" align="center">
                        <tr>
                          <td class="logo-badge" align="center" valign="middle" style="background:none;padding:0;">
                            <img src="https://dzeluqh8lm.ufs.sh/f/rykyAuEzqjmYCDH4cO986gaAVJBKP9hQuWosjqZz4YXOeEpy" width="56" height="56" alt="${EMAIL_CONFIG.APP_NAME} logo" style="display:block;margin:0 auto;border-radius:14px;" />
                          </td>
                        </tr>
                      </table>
                      <div style="height:12px;">&nbsp;</div>
                      <h1>Welcome to the ${EMAIL_CONFIG.APP_NAME} waitlist</h1>
                      <div style="height:8px;">&nbsp;</div>
                      <p class="muted">Thanks for registering your interest — you’re on the list. We’ll be in touch as we open access.</p>
                    </td>
                  </tr>
                </table>

                <!-- Body -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="p-32">
                      <p style="margin-bottom:14px;">Hey${firstName ? ` ${firstName}` : ''},</p>
                      <p style="margin-bottom:18px;">While you’re waiting, here are the best places to see what’s coming and follow progress:</p>

                      <!-- CTAs -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="cta">
                        <tr>
                          <td style="padding-right:8px;">
                            <a class="btn btn-primary" href="${featurebaseUrl}">See upcoming features</a>
                          </td>
                          <td style="padding-right:8px;">
                            <a class="btn btn-secondary" href="${roadmapUrl}">View our roadmap</a>
                          </td>
                          <td>
                            <a class="btn btn-secondary" href="${blogUrl}">Read our blog</a>
                          </td>
                        </tr>
                      </table>

                      <div style="height:22px;">&nbsp;</div>

                      <h2 style="font-size:18px; color:var(--text-color, #FBFDF8); margin-bottom:14px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">What you’ll get with ${EMAIL_CONFIG.APP_NAME}</h2>

                      <!-- Inline bullet list -->
                      <p style="margin:0 0 10px;">
                        <span style="color:#0F59FF;font-weight:bold;">•</span>
                        <span><strong>Clear workload planning</strong> for modules, teaching and allocations</span>
                      </p>
                      <p style="margin:0 0 10px;">
                        <span style="color:#0F59FF;font-weight:bold;">•</span>
                        <span><strong>Academic year scoping</strong> with quick year switching</span>
                      </p>
                      <p style="margin:0 0 10px;">
                        <span style="color:#0F59FF;font-weight:bold;">•</span>
                        <span><strong>Fine-grained permissions</strong> and roles for organisations</span>
                      </p>
                      <p style="margin:0 0 10px;">
                        <span style="color:#0F59FF;font-weight:bold;">•</span>
                        <span><strong>Privacy-respecting analytics</strong> and sensible audit trails</span>
                      </p>
                      <p style="margin:0 0 10px;">
                        <span style="color:#0F59FF;font-weight:bold;">•</span>
                        <span><strong>Fast, accessible UI</strong> built for teams</span>
                      </p>

                      <div style="height:18px;">&nbsp;</div>
                      <p class="muted">We appreciate your interest — more updates soon.</p>
                      <div style="height:14px;">&nbsp;</div>
                      <p style="margin:0;">Cheers,</p>
                      <p style="margin:4px 0 0;"><strong>Sam</strong></p>
                      <div style="height:10px;">&nbsp;</div>
                      <p class="muted" style="font-size:14px;">P.S. If you have any questions, just reply or drop me an email — I read them all.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="footer">
                <small>© ${new Date().getFullYear()} ${EMAIL_CONFIG.COMPANY_NAME}</small><br>
                <span class="apple-link"><small>${EMAIL_CONFIG.COMPANY_ADDRESS || ''}</small></span>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

export function generateWaitlistWelcomeEmailText(
  data: WaitlistWelcomeData
): string {
  const baseUrl = getBaseUrl();
  const featurebaseUrl = EMAIL_CONFIG.FEATUREBASE_URL;
  const roadmapUrl = `${featurebaseUrl}/roadmap`;
  const blogUrl = `${baseUrl}/blog`;
  const name = data.name?.trim();
  const firstName = name ? name.split(/\s+/)[0] : '';

  return `
Hey${firstName ? ` ${firstName}` : ''},

Thanks for registering your interest. You're on the waitlist — we'll be in touch soon.

See what's coming and follow our progress:
- Upcoming features: ${featurebaseUrl}
- Roadmap: ${roadmapUrl}
- Blog: ${blogUrl}

What you'll get with ${EMAIL_CONFIG.APP_NAME}:
- Clear workload planning for modules, teaching and allocations
- Academic year scoping and quick year switching
- Fine‑grained permissions and roles for organisations
- Privacy‑respecting analytics and sensible audit trails
- Fast UI with accessible components, built for teams

Cheers,
Sam

P.S. If you have any questions, just reply or drop me an email — I read them all.

© ${new Date().getFullYear()} ${EMAIL_CONFIG.COMPANY_NAME}
  `;
}

export async function sendWaitlistWelcomeEmail(
  data: WaitlistWelcomeData
): Promise<EmailResult> {
  if (process.env.NEXT_PUBLIC_E2E === 'true') {
    return { success: true, messageId: 'e2e-disabled' };
  }
  if (!resend) {
    return { success: false, error: 'Resend not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.WAITLIST_EMAIL || FROM_EMAIL,
      to: data.to,
      subject: `Thanks for joining the ${EMAIL_CONFIG.APP_NAME} waitlist`,
      html: generateWaitlistWelcomeEmailHTML(data),
      text: generateWaitlistWelcomeEmailText(data),
    });
    if (result.error) {
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }
    return { success: true, messageId: result.data?.id || 'unknown' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
