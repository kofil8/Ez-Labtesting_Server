import { Request, Response } from "express";
import AdminService from "./admin.service";

class AdminController {
  async dashboard(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await AdminService.getDashboardStats(user.companyId);
      res.status(200).json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async users(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const users = await AdminService.getCompanyUsers(user.companyId);
      res.status(200).json(users);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async teams(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const teams = await AdminService.getCompanyTeams(user.companyId);
      res.status(200).json(teams);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async payments(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const payments = await AdminService.getCompanyPayments(user.companyId);
      res.status(200).json(payments);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async roster(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const analytics = await AdminService.getRosterAnalytics(user.companyId);
      res.status(200).json(analytics);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
}

export default new AdminController();
