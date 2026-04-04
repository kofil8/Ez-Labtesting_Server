import nodemailer from 'nodemailer';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
      const smtpUser = process.env.SMTP_EMAIL;
      const smtpPass = process.env.SMTP_EMAIL_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

      if (smtpHost && smtpPort && smtpUser && smtpPass) {
        return nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      }

      if (smtpUser && smtpPass) {
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      }

      const testAccount = await nodemailer.createTestAccount();
      // eslint-disable-next-line no-console
      console.log('Using Ethereal test account', testAccount.user);

      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();
  }

  return transporterPromise;
};

const sentEmailUtility = async (
  emailTo: string,
  EmailSubject: string,
  EmailText: string,
  EmailHTML: string,
) => {
  const transporter = await getTransporter();

  const mailOption = {
    from:
      process.env.SMTP_FROM || `Service <${process.env.SMTP_EMAIL || 'no-reply@ezlabtesting.com'}>`,
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
