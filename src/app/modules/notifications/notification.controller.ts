import { Request, Response } from "express";
import { io } from "../../server"; // Access live socket instance
import NotificationService from "./notification.service";

const notificationService = new NotificationService(io);

class NotificationController {
  async create(req: Request, res: Response) {
    try {
      const notif = await notificationService.createNotification(req.body);
      res.status(201).json(notif);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const notifications = await notificationService.getUserNotifications(
        user.userId
      );
      res.status(200).json(notifications);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const notif = await notificationService.markAsRead(id);
      res.status(200).json(notif);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async sendEmail(req: Request, res: Response) {
    try {
      const { to, subject, html } = req.body;
      const result = await notificationService.sendEmailNotification(
        to,
        subject,
        html
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export default new NotificationController();
