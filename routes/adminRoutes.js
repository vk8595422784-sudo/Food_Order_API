import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  deleteUser,
  getDashboardStats,
} from "../controllers/adminController.js";

const router = Router();

// All admin routes require login + admin role
router.use(auth, adminAuth);

// Dashboard
router.get("/stats", getDashboardStats);

// Order management
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

// User management
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

export default router;
