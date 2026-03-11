export const emailTemplate = (otp: string, text: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Ez Lab Testing - Verification Code</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f3f7fb;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #13233a;
        }

        .email-shell {
            width: 100%;
            padding: 28px 14px;
            background: radial-gradient(circle at top right, #dbeaff 0%, #f3f7fb 52%, #edf4ff 100%);
        }

        .container {
            width: 100%;
            max-width: 620px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid #dbe5f2;
            box-shadow: 0 18px 52px rgba(14, 41, 74, 0.1);
        }

        .header {
            background: linear-gradient(120deg, #0e3b6f 0%, #1b5ea8 60%, #2f7ecf 100%);
            padding: 28px 24px;
            color: #ffffff;
        }

        .brand {
            display: table;
            width: 100%;
        }

        .brand-logo,
        .brand-copy {
            display: table-cell;
            vertical-align: middle;
        }

        .brand-logo img {
            width: 58px;
            height: 58px;
            border-radius: 12px;
            object-fit: contain;
            background: rgba(255, 255, 255, 0.15);
            padding: 6px;
        }

        .brand-copy {
            padding-left: 14px;
        }

        .brand-title {
            margin: 0;
            font-size: 25px;
            line-height: 1.2;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .brand-subtitle {
            margin: 4px 0 0 0;
            font-size: 12px;
            letter-spacing: 0.3px;
            opacity: 0.92;
            text-transform: uppercase;
        }

        .hero-title {
            margin: 22px 0 0 0;
            font-size: 30px;
            line-height: 1.2;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .content {
            padding: 34px 30px 18px;
        }

        .title {
            margin: 0;
            font-size: 24px;
            line-height: 1.25;
            text-align: center;
            color: #10233c;
            font-weight: 700;
        }

        .text {
            margin: 14px 0 0;
            font-size: 15px;
            line-height: 1.7;
            text-align: center;
            color: #4b5f79;
        }

        .otp-box {
            margin: 28px 0 0;
            border-radius: 16px;
            padding: 26px 18px;
            text-align: center;
            background: linear-gradient(150deg, #f7fbff 0%, #ecf4ff 100%);
            border: 1px solid #d5e7ff;
        }

        .otp-label {
            margin: 0;
            font-size: 12px;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #6481a6;
            font-weight: 700;
        }

        .otp-code {
            margin: 14px 0 12px;
            font-size: 44px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: 10px;
            color: #114683;
            font-family: 'Courier New', Courier, monospace;
        }

        .otp-expiry {
            margin: 0;
            font-size: 13px;
            color: #5f7898;
        }

        .security {
            margin-top: 18px;
            background: #fff9ef;
            border: 1px solid #ffe0ad;
            border-left: 4px solid #f0a020;
            border-radius: 10px;
            padding: 12px 14px;
            font-size: 12px;
            line-height: 1.55;
            color: #744c00;
        }

        .security strong {
            display: block;
            margin-bottom: 2px;
            font-size: 12px;
        }

        .footer {
            margin-top: 28px;
            background: #f7faff;
            border-top: 1px solid #e2e9f3;
            padding: 20px 26px 24px;
            text-align: center;
        }

        .footer p {
            margin: 0;
            font-size: 13px;
            line-height: 1.65;
            color: #5d6f86;
        }

        .footer a {
            color: #1c5faa;
            text-decoration: none;
            font-weight: 700;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .email-shell {
                padding: 14px 8px;
            }

            .container {
                border-radius: 14px;
            }

            .header {
                padding: 22px 16px;
            }

            .hero-title {
                font-size: 24px;
                margin-top: 18px;
            }

            .content {
                padding: 24px 16px 14px;
            }

            .title {
                font-size: 21px;
            }

            .otp-box {
                margin-top: 22px;
                padding: 20px 14px;
            }

            .otp-code {
                font-size: 35px;
                letter-spacing: 6px;
            }

            .footer {
                margin-top: 22px;
                padding: 16px 16px 20px;
            }
        }

        @media only screen and (max-width: 420px) {
            .brand-logo,
            .brand-copy {
                display: block;
            }

            .brand-copy {
                padding: 10px 0 0;
            }

            .brand-title {
                font-size: 22px;
            }

            .hero-title {
                font-size: 22px;
            }

            .otp-code {
                font-size: 31px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
        Your Ez Lab Testing verification code is ${otp}. It expires in 5 minutes.
    </div>
    <div class="email-shell">
        <div class="container">
            <div class="header">
                <div class="brand">
                    <div class="brand-logo">
                        <img src="${process.env.OTP_IMAGE_URL}" alt="Ez Lab Testing Logo" />
                    </div>
                    <div class="brand-copy">
                        <h1 class="brand-title">Ez Lab Testing</h1>
                        <p class="brand-subtitle">Secure Verification Portal</p>
                    </div>
                </div>
                <h2 class="hero-title">Verify Your Identity</h2>
            </div>

            <div class="content">
                <h3 class="title">Welcome to Ez Lab Testing</h3>
                <p class="text">${text}</p>

                <div class="otp-box">
                    <p class="otp-label">Your Verification Code</p>
                    <p class="otp-code">${otp}</p>
                    <p class="otp-expiry">Use this code within 5 minutes for your security.</p>
                </div>

                <div class="security">
                    <strong>Security Notice</strong>
                    Never share this code with anyone. Ez Lab Testing will never ask for this code by email, call, or message.
                </div>
            </div>

            <div class="footer">
                <p>
                    Need help? Contact <a href="mailto:support@ezlabtesting.com">support@ezlabtesting.com</a>
                </p>
                <p style="margin-top: 8px;">
                    &copy; ${new Date().getFullYear()} Ez Lab Testing. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
