import { Router } from "express";
import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createCheckoutSession,
  handleStripeWebhook,
  verifyPayment,
} from "../controllers/paymentController.js";

const router = Router();

// ⚠️  Webhook MUST use express.raw() — Stripe requires the raw body Buffer
// to verify the webhook signature. express.json() would break this.
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// Protected routes (require login)
router.post("/create-checkout-session", auth, createCheckoutSession);
router.get("/verify/:sessionId", auth, verifyPayment);

export default router;
