import { Router } from "express";
import {auth} from "../middleware/auth.js"
import { cancelOrder, getMyOrders, getOrderById, placeOrder } from "../controllers/orderController.js";

const router = Router()

router.use(auth)

router.post("/",placeOrder)
router.get("/",getMyOrders)
router.get("/:id",getOrderById)
router.put("/:id",cancelOrder)


export default router