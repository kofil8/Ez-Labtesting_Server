import axios from "axios";
import { Server } from "socket.io";
import prisma from "../../config/db";
import { env } from "../../config/env";
import { sendMail } from "../../config/mailer";
import { CreateNotificationInput } from "./notification.types";

class NotificationService {
  private io: Server;

  constructor(ioInstance: Server) {
    this.io = ioInstance;
  }

  // Create notification record + emit socket event
  async createNotification(data: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        link: data.link,
      },
    });

    this.io.to(data.userId).emit("notification", notification);
    return notification;
  }

  // Send email using SendGrid/Nodemailer
  async sendEmailNotification(to: string, subject: string, html: string) {
    await sendMail(to, subject, html);
    return { message: "Email sent successfully" };
  }

  // Send push notification using OneSignal REST API
  async sendPushNotification(userId: string, title: string, body: string) {
    try {
      await axios.post(
        "https://onesignal.com/api/v1/notifications",
        {
          app_id: env.ONESIGNAL_APP_ID,
          include_external_user_ids: [userId],
          headings: { en: title },
          contents: { en: body },
        },
        {
          headers: {
            Authorization: `Basic ${env.ONESIGNAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return { message: "Push notification sent" };
    } catch (err: any) {
      throw new Error(`Push notification failed: ${err.message}`);
    }
  }

  // Mark a notification as read
  async markAsRead(id: string) {
    const notif = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return notif;
  }

  // Fetch all notifications for user
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default NotificationService;
