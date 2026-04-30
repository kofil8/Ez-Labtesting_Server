type EmailLayoutParams = {
  previewText: string;
  heroTitle: string;
  title: string;
  description: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
};

const supportEmail = 'support@ezlabtesting.com';
const websiteUrl = 'https://ezlabtesting.com';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildEmailLayout = ({
  previewText,
  heroTitle,
  title,
  description,
  bodyHtml,
  ctaText,
  ctaUrl,
}: EmailLayoutParams) => {
  const year = new Date().getFullYear();
  const logoUrl = process.env.OTP_IMAGE_URL?.trim();

  const safePreviewText = escapeHtml(previewText);
  const safeHeroTitle = escapeHtml(heroTitle);
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCtaText = ctaText ? escapeHtml(ctaText) : '';

  const brandMedia = logoUrl
    ? `
      <img
        src="${logoUrl}"
        alt="EzLabTesting"
        width="44"
        height="44"
        style="display:block;border:0;outline:none;text-decoration:none;border-radius:10px;"
      />
    `
    : `
      <div
        style="
          width:44px;
          height:44px;
          line-height:44px;
          text-align:center;
          border-radius:10px;
          background:#e6f4ff;
          color:#0b6fa4;
          font-size:18px;
          font-weight:700;
          font-family:Arial,sans-serif;
        "
      >
        EZ
      </div>
    `;

  const ctaButton =
    ctaText && ctaUrl
      ? `
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:24px auto 0;">
          <tr>
            <td align="center" bgcolor="#0b6fa4" style="border-radius:8px;">
              <a
                href="${ctaUrl}"
                style="
                  display:inline-block;
                  padding:12px 22px;
                  font-family:Arial,sans-serif;
                  font-size:14px;
                  font-weight:600;
                  line-height:1.2;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                "
              >
                ${safeCtaText}
              </a>
            </td>
          </tr>
        </table>
      `
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EzLabTesting</title>
  <style>
    body, table, td, a, p {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse;
    }

    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }

    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f4f8fb;
      font-family: Arial, Helvetica, sans-serif;
      color: #1f2d3d;
    }

    .wrapper {
      width: 100%;
      background-color: #f4f8fb;
      padding: 24px 12px;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e3edf5;
      border-radius: 14px;
      overflow: hidden;
    }

    .header {
      padding: 22px 24px;
      border-bottom: 1px solid #eef3f7;
      background-color: #ffffff;
    }

    .brand-name {
      margin: 0;
      font-size: 16px;
      line-height: 1.2;
      font-weight: 700;
      color: #12344d;
    }

    .brand-subtitle {
      margin: 4px 0 0 0;
      font-size: 11px;
      line-height: 1.4;
      color: #7c97ab;
      letter-spacing: 0.2px;
    }

    .hero {
      padding: 28px 24px 10px;
      background-color: #ffffff;
    }

    .hero-title {
      margin: 0;
      font-size: 24px;
      line-height: 1.3;
      font-weight: 700;
      color: #0f2f46;
      letter-spacing: -0.2px;
    }

    .hero-subtitle {
      margin: 8px 0 0 0;
      font-size: 13px;
      line-height: 1.6;
      color: #6f8799;
    }

    .content {
      padding: 20px 24px 28px;
      background-color: #ffffff;
    }

    .title {
      margin: 0;
      font-size: 21px;
      line-height: 1.3;
      font-weight: 700;
      color: #12344d;
      text-align: center;
      letter-spacing: -0.2px;
    }

    .description {
      margin: 10px 0 0 0;
      font-size: 14px;
      line-height: 1.7;
      color: #5f7486;
      text-align: center;
    }

    .divider {
      border: 0;
      border-top: 1px solid #eef3f7;
      margin: 20px 0;
    }

    .body-content {
      font-size: 14px;
      line-height: 1.7;
      color: #324a5e;
    }

    .body-content p {
      margin: 0 0 14px;
    }

    .body-content a {
      color: #0b6fa4;
      text-decoration: none;
      font-weight: 600;
    }

    .footer {
      padding: 18px 20px 22px;
      text-align: center;
      background-color: #f7fbff;
      border-top: 1px solid #e3edf5;
    }

    .footer-text {
      margin: 4px 0;
      font-size: 12px;
      line-height: 1.6;
      color: #6b879a;
    }

    .footer-link {
      color: #0b6fa4;
      text-decoration: none;
      font-weight: 600;
    }

    @media only screen and (max-width: 600px) {
      .wrapper {
        padding: 12px 8px;
      }

      .header,
      .hero,
      .content {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }

      .header {
        padding-top: 18px !important;
        padding-bottom: 18px !important;
      }

      .hero {
        padding-top: 22px !important;
      }

      .content {
        padding-bottom: 22px !important;
      }

      .hero-title {
        font-size: 21px !important;
      }

      .title {
        font-size: 19px !important;
      }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${safePreviewText}
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="wrapper">
    <tr>
      <td align="center">
        <table
          role="presentation"
          width="600"
          border="0"
          cellspacing="0"
          cellpadding="0"
          class="container"
          style="width:100%;max-width:600px;"
        >
          <tr>
            <td class="header">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="52" valign="middle" style="width:52px;">
                    ${brandMedia}
                  </td>
                  <td valign="middle" style="padding-left:10px;">
                    <p class="brand-name">EzLabTesting</p>
                    <p class="brand-subtitle">Medical Lab Testing Marketplace</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="hero">
              <h1 class="hero-title">${safeHeroTitle}</h1>
              <p class="hero-subtitle">Fast. Accurate. Trusted diagnostics.</p>
            </td>
          </tr>

          <tr>
            <td class="content">
              <h2 class="title">${safeTitle}</h2>
              <p class="description">${safeDescription}</p>

              <hr class="divider" />

              <div class="body-content">
                ${bodyHtml}
              </div>

              ${ctaButton}
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p class="footer-text">
                Need help?
                <a class="footer-link" href="mailto:${supportEmail}">${supportEmail}</a>
              </p>
              <p class="footer-text">
                <a class="footer-link" href="${websiteUrl}">ezlabtesting.com</a>
              </p>
              <p class="footer-text">&copy; ${year} EzLabTesting. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
