// import { env } from "process";
import nodemailer from "nodemailer";
import smtpTransporter from "nodemailer-smtp-transport";

let sentEmailUtility = async (
  emailTo: string,
  EmailSubject: string,
  EmailText: string,
  EmailHTML: string
) => {
  let transporter = nodemailer.createTransport(
    smtpTransporter({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  );

  let mailOption = {
    from: "Demo Service <no-reply@gmail.com>",
    to: emailTo,
    subject: EmailSubject,
    text: EmailText,
    html: EmailHTML,
  };

  return await transporter.sendMail(mailOption);
};

export default sentEmailUtility;
