import express from "express";
import multer from "multer";
import {
  registerBride,
  getBrideById,
  getBrideByUser,
  updateBride,
  listBrides,
  deleteBride,
  checkBrideExists,
} from "../controller/brideController.js";
import auth from "../middleWare/authMiddleware.js";
import adminAuth from "../middleWare/adminAuth.js";

const router = express.Router();

// USE MEMORY STORAGE (required for Cloudinary upload_stream)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// User Protected
router.post("/register", auth, upload.array("photos", 5), registerBride);

// Public
router.get("/", listBrides);
router.get("/user/:userId", getBrideByUser);
router.get("/check/:userId", checkBrideExists);
router.get("/:id", getBrideById);

// User Protected
router.put("/:id", auth, upload.array("photos", 5), updateBride);

// Admin Protected
router.delete("/:id", adminAuth, deleteBride);

export default router;
