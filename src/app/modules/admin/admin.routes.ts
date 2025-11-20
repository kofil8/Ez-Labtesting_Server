import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import AdminController from "./admin.controller";

const router = Router();

// All admin routes require auth & admin role
router.use(authenticate, authorizeRoles("ADMIN"));

// Admin Dashboard APIs
router.get("/dashboard", AdminController.dashboard);
router.get("/users", AdminController.users);
router.get("/teams", AdminController.teams);
router.get("/payments", AdminController.payments);
router.get("/roster-analytics", AdminController.roster);

export default router;
