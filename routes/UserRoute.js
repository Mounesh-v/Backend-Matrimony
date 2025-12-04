import express from "express";
import { getUserById, login, signup,getMyData } from "../controller/User.js";
import protect from "../middleWare/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

router.post("/signup", upload.single("profilePic"), signup);
router.post("/login", login);
router.get("/me", protect, getUserById);
router.get("/:id",getMyData)

export default router;
