import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const REGISTER = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "fail",
        message: "user already exist",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashPassword,
    });
    const token = jwt.sign({ _id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "5d",
    });
    newUser.password = undefined;

    return res.status(201).json({
      status: "success",
      data: newUser,
      token,
      message: "User Registered",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

export const LOGIN = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect username or password",
      });
    }

    const token = jwt.sign({ _id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "5d",
    });
    user.password = undefined;

    return res.status(200).json({
      status: "success",
      data: user,
      token,
      message: "User Login Successful",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: "login fail",
    });
  }
};
