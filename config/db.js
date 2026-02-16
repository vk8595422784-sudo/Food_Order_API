import mongoose from "mongoose";

export const connectDB = async ()=>{
  try {
    const db = await mongoose.connect(process.env.MONGO_URL)
    console.log("Database connected")
  } catch (error) {
    console.log("Databse Connection error")
  }
}