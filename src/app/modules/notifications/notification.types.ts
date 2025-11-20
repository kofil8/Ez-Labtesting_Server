export interface CreateNotificationInput {
  type: "shift" | "invite" | "system" | "payment";
  title: string;
  message: string;
  userId: string;
  link?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}
