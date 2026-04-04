import { buildEmailLayout } from './emailLayoutTemplate';

export const welcomeEmailTemplate = (name?: string) =>
  buildEmailLayout({
    previewText: 'Your email has been verified successfully. Welcome to Ez Lab Testing.',
    heroTitle: 'Email verified successfully',
    title: name ? `Welcome, ${name}!` : 'Welcome to Ez Lab Testing!',
    description:
      'Your account is now active. You can book lab tests, track orders, and manage reports securely from your dashboard.',
    bodyHtml: `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:24px;">
        <tr>
          <td style="background:#ffffff;border:1px solid #e4edf3;border-radius:16px;padding:24px 20px;">
            <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#334d5c;">
              Thanks for verifying your email. Your account is ready to use.
            </p>

            <p style="margin:0 0 14px;font-size:14px;line-height:22px;color:#334d5c;">
              You can now:
            </p>

            <ul style="margin:0 0 0 18px;padding:0;color:#334d5c;font-size:14px;line-height:22px;">
              <li style="margin:0 0 8px;">Browse available tests and panels</li>
              <li style="margin:0 0 8px;">Place orders and track status in real time</li>
              <li style="margin:0;">Access your reports from one place</li>
            </ul>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:16px;">
        <tr>
          <td style="background:#f8fbfd;border:1px solid #e6edf2;border-radius:12px;padding:14px 16px;">
            <p style="margin:0;font-size:13px;line-height:21px;color:#5c6f7c;">
              Visit our website:
              <a href="https://ezlabtesting.com" style="color:#0f6e99;text-decoration:none;font-weight:700;">ezlabtesting.com</a>
            </p>
          </td>
        </tr>
      </table>
    `,
  });
