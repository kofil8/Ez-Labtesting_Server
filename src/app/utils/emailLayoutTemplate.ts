type EmailLayoutParams = {
  previewText: string;
  heroTitle: string;
  title: string;
  description: string;
  bodyHtml: string;
};

const supportEmail = 'support@ezlabtesting.com';
const websiteUrl = 'https://ezlabtesting.com';

export const buildEmailLayout = ({
  previewText,
  heroTitle,
  title,
  description,
  bodyHtml,
}: EmailLayoutParams) => {
  const year = new Date().getFullYear();
  const logoUrl = process.env.OTP_IMAGE_URL?.trim();

  const brandMedia = logoUrl
    ? `<img src="${logoUrl}" alt="Ez Lab Testing Logo" width="56" height="56" style="display:block;border:0;outline:none;text-decoration:none;border-radius:12px;background:#e8f4ff;padding:6px;" />`
    : `<div style="width:56px;height:56px;line-height:56px;text-align:center;border-radius:12px;background:#e8f4ff;color:#0f6f9f;font-size:22px;font-weight:800;font-family:Arial,sans-serif;">EZ</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Ez Lab Testing Notification</title>
  <style>
    body, table, td, p, a {
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
    }

    body {
      margin: 0;
      padding: 0;
      width: 100%;
      background-color: #eef5fb;
      font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
      color: #1b2e3d;
    }

    .wrapper {
      width: 100%;
      background-color: #eef5fb;
      background-image: linear-gradient(180deg, #e9f3fb 0%, #eef5fb 42%, #f7fbff 100%);
      padding: 26px 12px;
    }

    .container {
      width: 100%;
      max-width: 620px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #d8e8f5;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 14px 38px rgba(13, 59, 90, 0.1);
    }

    .header {
      background: #0f6f9f;
      background-image: linear-gradient(135deg, #0a5c87 0%, #0f6f9f 45%, #1383ba 100%);
      padding: 26px 24px 24px;
      color: #ffffff;
    }

    .brand-title {
      margin: 0;
      font-size: 23px;
      line-height: 1.2;
      font-weight: 700;
      color: #ffffff;
    }

    .brand-subtitle {
      margin: 4px 0 0 0;
      font-size: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #d7f4ff;
    }

    .hero-title {
      margin: 16px 0 0 0;
      font-size: 30px;
      line-height: 1.25;
      font-weight: 800;
      letter-spacing: -0.2px;
      color: #ffffff;
    }

    .hero-subtitle {
      margin: 10px 0 0;
      font-size: 13px;
      line-height: 1.6;
      color: #d9effb;
    }

    .content {
      padding: 30px 26px 18px;
      background: #ffffff;
    }

    .title {
      margin: 0;
      font-size: 26px;
      line-height: 1.25;
      text-align: center;
      color: #0f3047;
      font-weight: 800;
      letter-spacing: -0.3px;
    }

    .description {
      margin: 12px 0 0;
      font-size: 15px;
      line-height: 1.75;
      text-align: center;
      color: #4a6478;
    }

    .content-divider {
      margin: 18px 0 0;
      border: 0;
      border-top: 1px solid #ebf2f8;
    }

    .footer {
      background-color: #f5faff;
      border-top: 1px solid #dbeaf6;
      padding: 22px 20px;
      text-align: center;
    }

    .footer-text {
      margin: 0;
      font-size: 13px;
      line-height: 1.7;
      color: #5a7286;
    }

    .footer-link {
      color: #0f6f9f;
      text-decoration: none;
      font-weight: 700;
    }

    @media only screen and (max-width: 600px) {
      .wrapper {
        padding: 12px 8px;
      }

      .header {
        padding: 20px 14px;
      }

      .content {
        padding: 24px 14px 12px;
      }

      .title {
        font-size: 22px;
      }

      .hero-title {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="wrapper">
    <tr>
      <td align="center">
        <table role="presentation" width="620" border="0" cellspacing="0" cellpadding="0" class="container" style="width:100%;max-width:620px;">
          <tr>
            <td class="header">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="70" valign="middle">${brandMedia}</td>
                  <td valign="middle" style="padding-left:12px;">
                    <p class="brand-title">Ez Lab Testing</p>
                    <p class="brand-subtitle">Health Testing Platform</p>
                  </td>
                </tr>
              </table>
              <h2 class="hero-title">${heroTitle}</h2>
              <p class="hero-subtitle">Trusted diagnostics. Faster decisions. Better care.</p>
            </td>
          </tr>

          <tr>
            <td class="content">
              <h3 class="title">${title}</h3>
              <p class="description">${description}</p>
              <hr class="content-divider" />
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p class="footer-text">Need help? Contact <a class="footer-link" href="mailto:${supportEmail}">${supportEmail}</a></p>
              <p class="footer-text" style="margin-top:6px;">Visit our website: <a class="footer-link" href="${websiteUrl}">ezlabtesting.com</a></p>
              <p class="footer-text" style="margin-top:8px;">&copy; ${year} Ez Lab Testing. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
