import jwt from "jsonwebtoken";
import User from "../model/User.js";
import dotenv from "dotenv";
dotenv.config();

// admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export const adminLogin = (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Received:", email, password);
    console.log("ENV:", process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return res.status(500).json({
        message: "Admin credentials not set in ENV",
      });
    }

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Admin login successful",
      token,
    });
  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const userRemoved = await User.findByIdAndDelete(userId);
    if (!userRemoved)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "User deleted successfully",
      deletedUser: userRemoved,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const getUser = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
};
