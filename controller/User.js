import bcrypt from "bcryptjs";
import User from "../model/User.js";
import jwt from "jsonwebtoken";
import upload from "../config/multer.js";

export const signup = async (req, res) => {
  try {
    console.log("FILE:", req.file); // Check file object
    console.log("BODY:", req.body);
    const { name, email, password, role } = req.body;
    const profilePic = req.file?.path;

    if (!name || !email || !password || !role || !profilePic) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "User already Exist" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      profilePic,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.log("ERROR OCCURRED:", error); // MOST IMPORTANT
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "No user found" });

  const correct = await bcrypt.compare(password, user.password);
  if (!correct) return res.status(400).json({ message: "Incorrect password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({
    message: "Login successful",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const getUserById = async (req, res) => {
  try {
    // req.user may be a User document, or a Groom/Bride document with a userId pointing to User
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyData = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } 
    res.json(user);
  } catch (err) {
    console.error("getMyData error:", err);
    res.status(500).json({ message: "Server error" });
  }
};