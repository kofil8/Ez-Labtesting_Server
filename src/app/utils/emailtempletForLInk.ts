import { buildEmailLayout } from './emailLayoutTemplate';
import emailSender from './emailSender';

export const resetPasswordEmailTemplate = (resetPassLink: string) =>
  buildEmailLayout({
    previewText: 'Reset your Ez Lab Testing password from this secure link.',
    heroTitle: 'Password Support',
    title: 'Reset Your Password',
    description:
      'We received a request to reset your password. Use the secure button below to continue.',
    bodyHtml: `
                        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:22px;">
                                <tr>
                                        <td style="border:1px solid #c9e8f6;border-radius:14px;background:#f1fbff;padding:22px 18px;text-align:center;">
                                                <a href="${resetPassLink}" style="display:inline-block;background:#0f6f9f;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;line-height:1;padding:14px 24px;border-radius:10px;">Reset Password</a>
                                                <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#5e7a8e;">For your security, this link may expire shortly. If the button does not work, copy and paste the URL into your browser.</p>
                                                <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#5e7a8e;word-break:break-all;">${resetPassLink}</p>
                                        </td>
                                </tr>
                        </table>

                        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:16px;">
                                <tr>
                                        <td style="border:1px solid #ffe4b4;border-left:4px solid #f6a51a;border-radius:10px;background:#fffaf0;padding:12px 14px;">
                                                <p style="margin:0;font-size:12px;line-height:1.55;color:#7d5711;">If you did not request a password reset, you can safely ignore this email.</p>
                                        </td>
                                </tr>
                        </table>
                `,
  });

const emailTemplet = async (email: string, resetPassLink: string) => {
  return await emailSender('Reset Your Password', email, resetPasswordEmailTemplate(resetPassLink));
};

export default emailTemplet;
