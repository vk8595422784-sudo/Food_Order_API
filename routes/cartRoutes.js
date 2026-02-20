import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  addToCart,
  clearCart,
  getCart,
  removeItem,
} from "../controllers/cartController.js";

const router = Router();

router.use(auth);

router.post("/", addToCart);
router.get("/", getCart);

// ⚠️  IMPORTANT: clearCart DELETE "/" MUST come BEFORE removeItem DELETE "/:foodId"
// because Express matches routes top-to-bottom and "/:foodId" would consume "/" first.
router.delete("/clear", clearCart);
router.delete("/:foodId", removeItem);

export default router;
