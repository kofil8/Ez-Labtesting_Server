import express, { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import PaymentController from "./payment.controller";

const router = Router();

// Stripe webhook endpoint (no auth, raw body)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.webhook
);

// Authenticated routes
router.use(authenticate);
router.post("/checkout", PaymentController.createCheckout);
router.get("/history", PaymentController.history);

export default router;
