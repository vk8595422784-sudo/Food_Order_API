import { Router } from "express";
import {auth} from '../middleware/auth.js'
import { addToCart, clearCart, getCart, removeItem } from "../controllers/cartController.js";

const router = Router()

router.use(auth)

router.post("/",addToCart)
router.get("/",getCart)
router.delete("/:foodId",removeItem)
router.delete("/",clearCart)


export default router