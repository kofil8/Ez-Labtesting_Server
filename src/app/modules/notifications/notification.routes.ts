import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import NotificationController from "./notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", NotificationController.getAll);
router.post("/", NotificationController.create);
router.patch("/:id/read", NotificationController.markRead);
router.post("/email", NotificationController.sendEmail);

export default router;
