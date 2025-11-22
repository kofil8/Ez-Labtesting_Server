import nodemailer from 'nodemailer';

const sentEmailUtility = async (
  emailTo: string,
  EmailSubject: string,
  EmailText: string,
  EmailHTML: string,
) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_EMAIL;
  const smtpPass = process.env.SMTP_EMAIL_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  let transporter: nodemailer.Transporter;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    // Use explicit SMTP host/port if provided
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else if (smtpUser && smtpPass) {
    // Fall back to service-based transport (e.g., Gmail). For Gmail, prefer app passwords.
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    // No SMTP configuration provided — create an Ethereal test account for local testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    // Helpful log for developers to preview the test account
    // eslint-disable-next-line no-console
    console.log('Using Ethereal test account', testAccount.user);
  }

  const mailOption = {
    from: process.env.SMTP_FROM || `Demo Service <${smtpUser || 'no-reply@example.com'}>`,
    to: emailTo,
    subject: EmailSubject,
    text: EmailText,
    html: EmailHTML,
  };

  try {
    const info = await transporter.sendMail(mailOption);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      // eslint-disable-next-line no-console
      console.log('Preview URL: %s', previewUrl);
    }
    return info;
  } catch (err) {
    // Wrap error with clearer message for upstream handlers
    throw new Error(`Failed to send email: ${(err as Error).message}`);
  }
};

export default sentEmailUtility;
