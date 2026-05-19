'use server';

type SendPasswordResetState = {
  success: boolean;
  error: string | null;
};

const genericErrorMessage =
  'Unable to send password reset email. Please try again.';

export async function sendPasswordResetEmail(
  _previousState: SendPasswordResetState,
  formData: FormData
): Promise<SendPasswordResetState> {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return {
      success: false,
      error: 'Email address is missing.',
    };
  }

  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;
  const passwordResetUrl = process.env.WORKOS_PASSWORD_RESET_URL;

  if (!apiKey || !clientId || !passwordResetUrl) {
    return {
      success: false,
      error: 'Password reset is not configured.',
    };
  }

  try {
    const response = await fetch(
      'https://api.workos.com/user_management/password_reset/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          client_id: clientId,
          password_reset_url: passwordResetUrl,
        }),
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: genericErrorMessage,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: genericErrorMessage,
    };
  }
}