import { buildEmailLayout } from './emailLayoutTemplate';

export const emailTemplate = (otp: string, text?: string) =>
  buildEmailLayout({
    previewText: `${otp} is your Ez Lab Testing verification code. Expires in 5 minutes.`,
    heroTitle: 'Your verification code',
    title: 'Secure email verification',
    description: text || 'Use the code below to verify your email address and continue securely.',
    bodyHtml: `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:24px;">
        <tr>
          <td style="background:#ffffff;border:1px solid #e4edf3;border-radius:16px;padding:28px 20px;text-align:center;">
            <p style="margin:0 0 10px;font-size:12px;line-height:18px;letter-spacing:1.2px;text-transform:uppercase;color:#5f7485;font-weight:700;">
              Verification Code
            </p>

            <p style="margin:0 0 12px;font-size:38px;line-height:42px;font-weight:800;letter-spacing:6px;color:#0f5f85;font-family:Arial,Helvetica,sans-serif;">
              ${otp}
            </p>

            <p style="margin:0;font-size:14px;line-height:22px;color:#526471;">
              This code expires in <strong>5 minutes</strong>.
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:16px;">
        <tr>
          <td style="background:#f8fbfd;border:1px solid #e6edf2;border-radius:12px;padding:14px 16px;">
            <p style="margin:0 0 6px;font-size:13px;line-height:20px;font-weight:700;color:#29485a;">
              Security reminder
            </p>
            <p style="margin:0;font-size:13px;line-height:21px;color:#5c6f7c;">
              Never share this code with anyone. Ez Lab Testing will never ask for your verification code by email, phone call, or message.
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:18px;">
        <tr>
          <td style="padding:0 4px;">
            <p style="margin:0;font-size:13px;line-height:21px;color:#6a7c89;text-align:center;">
              Need help? Contact
              <a href="mailto:support@ezlabtesting.com" style="color:#0f6e99;text-decoration:none;font-weight:700;">support@ezlabtesting.com</a>
            </p>
          </td>
        </tr>
      </table>
    `,
  });
