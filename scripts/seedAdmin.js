import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

await mongoose.connect(process.env.MONGO_URI);
const User = (await import("../models/user.js")).default;

// Promote existing admin@test.com to admin role, or create fresh
let admin = await User.findOneAndUpdate(
  { email: "admin@test.com" },
  { role: "admin" },
  { new: true },
);

if (!admin) {
  const hash = await bcrypt.hash("admin123", 10);
  admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: hash,
    role: "admin",
  });
  console.log("✅ Admin created:", admin.email, "| role:", admin.role);
} else {
  console.log("✅ Admin role set for:", admin.email, "| role:", admin.role);
}

await mongoose.disconnect();
process.exit(0);
