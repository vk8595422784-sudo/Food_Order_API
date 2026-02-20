import express from "express";
import { config } from "dotenv";
import { connectDB } from "./config/db.js";
import cartRoutes from "./routes/cartRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

config();
connectDB();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core routes
app.use("/api/users", userRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Admin routes (protected by auth + adminAuth inside the router)
app.use("/api/admin", adminRoutes);

// Payment routes (Stripe webhook uses raw body — handled inside paymentRoutes)
app.use("/api/payment", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
