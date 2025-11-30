export const emailTemplate = (otp: string, text: string) => `
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Ez Lab Testing - Verification Code</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px 0;
            min-height: 100vh;
        }

        .wrapper {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
        }

        .header-top {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
        }

        .logo-container {
            flex-shrink: 0;
        }

        .logo-container img {
            width: 120px;
            height: auto;
            display: block;
            max-width: 100%;
        }

        .brand-text {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            text-align: left;
            letter-spacing: -0.5px;
        }

        .brand-text .main {
            display: block;
            font-size: 26px;
        }

        .brand-text .sub {
            display: block;
            font-size: 13px;
            font-weight: 500;
            opacity: 0.95;
            margin-top: 2px;
        }

        .header-title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin: 20px 0 0 0;
            letter-spacing: -0.5px;
        }

        .content {
            padding: 40px 30px;
        }

        .greeting {
            font-size: 22px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 16px;
            text-align: center;
        }

        .description {
            font-size: 15px;
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 32px;
            text-align: center;
        }

        .otp-section {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px;
            padding: 32px;
            margin: 32px 0;
            text-align: center;
            border-left: 4px solid #667eea;
        }

        .otp-label {
            font-size: 13px;
            font-weight: 600;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
            display: block;
        }

        .otp-code {
            font-size: 48px;
            font-weight: 700;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            word-break: break-all;
            margin: 0;
        }

        .otp-expiry {
            font-size: 12px;
            color: #a0aec0;
            margin-top: 16px;
        }

        .footer {
            background-color: #f7fafc;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }

        .footer-text {
            font-size: 13px;
            color: #718096;
            line-height: 1.5;
            margin: 0;
        }

        .footer-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }

        .footer-link:hover {
            text-decoration: underline;
        }

        .security-note {
            background-color: #fef5e7;
            border-left: 4px solid #f39c12;
            padding: 12px 16px;
            border-radius: 4px;
            margin-top: 24px;
            font-size: 12px;
            color: #7d6608;
            line-height: 1.5;
        }

        .security-note strong {
            display: block;
            margin-bottom: 4px;
        }

        /* Tablet Styles */
        @media only screen and (max-width: 768px) {
            .wrapper {
                border-radius: 8px;
                margin: 10px;
            }

            .header {
                padding: 30px 20px;
            }

            .header-top {
                gap: 15px;
                margin-bottom: 15px;
            }

            .logo-container img {
                width: 100px;
            }

            .brand-text {
                font-size: 18px;
            }

            .brand-text .main {
                font-size: 20px;
            }

            .brand-text .sub {
                font-size: 12px;
            }

            .header-title {
                font-size: 24px;
            }

            .content {
                padding: 30px 24px;
            }

            .greeting {
                font-size: 20px;
                margin-bottom: 12px;
            }

            .description {
                font-size: 14px;
                margin-bottom: 24px;
            }

            .otp-section {
                padding: 24px;
                margin: 24px 0;
            }

            .otp-code {
                font-size: 40px;
                letter-spacing: 6px;
            }

            .footer {
                padding: 20px 24px;
            }

            .footer-text {
                font-size: 12px;
            }
        }

        /* Mobile Styles */
        @media only screen and (max-width: 480px) {
            body {
                padding: 10px 0;
            }

            .wrapper {
                border-radius: 6px;
                margin: 5px;
            }

            .header {
                padding: 20px 16px;
            }

            .header-top {
                flex-direction: column;
                gap: 12px;
                margin-bottom: 12px;
            }

            .logo-container img {
                width: 80px;
            }

            .brand-text {
                text-align: center;
                font-size: 16px;
            }

            .brand-text .main {
                font-size: 18px;
            }

            .brand-text .sub {
                font-size: 11px;
            }

            .header-title {
                font-size: 20px;
                margin-top: 12px;
            }

            .content {
                padding: 24px 16px;
            }

            .greeting {
                font-size: 18px;
                margin-bottom: 10px;
            }

            .description {
                font-size: 13px;
                margin-bottom: 20px;
            }

            .otp-section {
                padding: 20px;
                margin: 20px 0;
                border-left-width: 3px;
            }

            .otp-label {
                font-size: 12px;
                margin-bottom: 12px;
            }

            .otp-code {
                font-size: 36px;
                letter-spacing: 4px;
            }

            .otp-expiry {
                font-size: 11px;
                margin-top: 12px;
            }

            .footer {
                padding: 16px;
            }

            .footer-text {
                font-size: 11px;
            }

            .security-note {
                font-size: 11px;
                padding: 10px 12px;
                margin-top: 16px;
            }
        }

        /* Small Mobile Devices */
        @media only screen and (max-width: 320px) {
            .header {
                padding: 14px 10px;
            }

            .header-top {
                gap: 8px;
            }

            .logo-container img {
                width: 70px;
            }

            .brand-text {
                font-size: 14px;
            }

            .brand-text .main {
                font-size: 15px;
            }

            .brand-text .sub {
                font-size: 10px;
            }

            .header-title {
                font-size: 16px;
            }

            .content {
                padding: 16px 12px;
            }

            .greeting {
                font-size: 16px;
            }

            .description {
                font-size: 12px;
            }

            .otp-code {
                font-size: 28px;
                letter-spacing: 2px;
            }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <!-- Header Section -->
        <div class="header">
            <div class="header-top">
                <div class="logo-container">
                    <img src="${process.env.OTP_IMAGE_URL}" alt="Ez Lab Testing Logo" />
                </div>
                <div class="brand-text">
                    <span class="main">Ez Lab Testing</span>
                    <span class="sub">Verification Portal</span>
                </div>
            </div>
            <h1 class="header-title">Verify Your Identity</h1>
        </div>

        <!-- Main Content -->
        <div class="content">
            <h2 class="greeting">Welcome to Ez Lab Testing!</h2>
            <p class="description">${text}</p>

            <!-- OTP Section -->
            <div class="otp-section">
                <span class="otp-label">Your Verification Code</span>
                <p class="otp-code">${otp}</p>
                <p class="otp-expiry">This code will expire in 5 minutes</p>
            </div>

            <!-- Security Note -->
            <div class="security-note">
                <strong>🔒 Security Notice</strong>
                Never share this code with anyone. We will never ask for this code via email or phone.
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                Questions? Contact us at <a href="mailto:support@ezlabtesting.com" class="footer-link">support@ezlabtesting.com</a>
            </p>
            <p class="footer-text" style="margin-top: 12px;">
                © 2025 Ez Lab Testing. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;
