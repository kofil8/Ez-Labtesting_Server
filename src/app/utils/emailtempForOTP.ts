export const emailTemplate = (otp: string, text: string) => `
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-collapse: collapse;
        }
        .logo img {
            width: 200px;
            height: auto;
        }
        .content h3 {
            font-size: 46px;
            font-weight: bold;
            color: #333;
        }
        .content p {
            font-size: 14px;
            color: #333;
        }
        .otp h1 {
            font-size: 46px;
            font-weight: bold;
            color: #5c68e2;
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 0 10px;
            }
            .logo img {
                width: 100px;
            }
            .content h3 {
                font-size: 24px;
            }
            .content p {
                font-size: 14px;
            }
            .otp h1 {
                font-size: 28px;
            }
        }
        @media only screen and (max-width: 400px) {
            .content h3 {
                font-size: 20px;
            }
            .content p {
                font-size: 12px;
            }
            .otp h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <table cellpadding="0" cellspacing="0" align="center" style="width:100%; table-layout:fixed; background-color:#f5f5f5;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" class="container">
                    <tr>
                        <td align="center" class="logo" style="padding:30px 20px;">
                            <img src=${process.env.OTP_IMAGE_URL} alt="Logo" style="display:block; border:0;"/>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" class="content" style="padding:10px 20px;">
                            <h3 style="margin:0;">
                                Welcome to Rezbouchabu
                            </h3>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" class="content" style="padding:5px 40px;">
                            <p style="margin:0;">
                                ${text}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:10px 20px;">
                            <table cellpadding="0" cellspacing="0" style="width:100%; border:2px dashed #ccc; border-radius:5px;">
                                <tr>
                                    <td align="center" style="padding:20px;">
                                        <h3 style="margin:0;">
                                            Your verification code is:
                                        </h3>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" class="otp" style="padding:10px 20px;">
                                        <h1 style="margin:0;">
                                            ${otp}
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
