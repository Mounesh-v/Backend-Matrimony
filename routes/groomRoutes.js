import express from "express";
import auth from "../middleWare/authMiddleware.js";
import adminAuth from "../middleWare/adminAuth.js";
import upload from "../middleware/multer.js";

import {
  registerGroom,
  updateGroom,
  listGrooms,
  deleteGroom,
  checkGroomExists,
  getGroomByUser,
  getGroomById,
} from "../controller/groomController.js";

const router = express.Router();

// Create Groom (With Cloudinary)
router.post("/register", auth, upload.array("photos", 5), registerGroom);

// Fetch
router.get("/", listGrooms);
router.get("/user/:userId", getGroomByUser);
router.get("/check/:userId", checkGroomExists);
router.get("/:id", getGroomById);

// Update
router.put("/:id", auth, upload.array("photos", 5), updateGroom);

// Delete (Admin)
router.delete("/:id", adminAuth, deleteGroom);

export default router;
