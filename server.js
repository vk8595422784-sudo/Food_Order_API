import express from 'express'
import { config } from 'dotenv'
import { connectDB } from './config/db.js'
import cartRoutes from './routes/cartRoutes.js'
import foodRoutes from './routes/foodRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import userRoutes from './routes/userRoutes.js'

config()
connectDB()

const PORT = process.env.PORT || 3000

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/api/users", userRoutes) 
app.use("/api/foods", foodRoutes) 
app.use("/api/cart", cartRoutes) 
app.use("/api/orders", orderRoutes)


app.listen(PORT,()=>{
  console.log(`server running on : ${PORT}`)
})