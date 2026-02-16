import { Router } from "express";
import { LOGIN, REGISTER } from "../controllers/userController.js";


const router = Router()

router.route("/register").post(REGISTER)
router.route("/login").post(LOGIN)


export default router