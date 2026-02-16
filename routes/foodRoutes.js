import {auth} from '../middleware/auth.js'
import { Router } from "express";
import { createFood, deleteFood, getFood, updateFood } from "../controllers/foodController.js";


const router = Router()

router.get("/",getFood)
router.post("/",auth,createFood)
router.put("/:id",auth,updateFood)
router.delete("/:id",auth,deleteFood)


export default router