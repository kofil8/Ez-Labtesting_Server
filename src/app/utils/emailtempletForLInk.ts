import emailSender from "./emailSender";

const emailTemplet = async (email: string, resetPassLink: string) => {
  return await emailSender(
    "Reset Your Password",
    email,
    `<!DOCTYPE html>
<html lang="en">
<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; line-height: 1.6; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #FF7600; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
                </div>
                <div style="padding: 40px 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">Dear User,</p>

                        <p style="font-size: 16px; margin-bottom: 30px;">We received a request to reset your password. Click the button below to reset your password:</p>

                        <div style="text-align: center; margin-bottom: 30px;">
                                <a href="${resetPassLink}" style="display: inline-block; background-color: #FF7600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: 600; transition: background-color 0.3s ease;">
                                        Reset Password
                                </a>
                        </div>

                        <p style="font-size: 16px; margin-bottom: 20px;">If you did not request a password reset, please ignore this email or contact support if you have any concerns.</p>

                        <p style="font-size: 16px; margin-bottom: 0;">Best regards,<br>Rezbouchabu Support Team</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d;">
                        <p style="margin: 0 0 10px;">This is an automated message, please do not reply to this email.</p>
                        <p style="margin: 0;">© 2025 Southclax LLC. All rights reserved.</p>
                </div>
        </div>
</body>
</html>`
  );
};

export default emailTemplet;
