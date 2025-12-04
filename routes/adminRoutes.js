import express from "express";
import {
  adminLogin,
  deleteUser,
  getAllUsers,
  getUserById,
} from "../controller/adminController.js";
import adminAuth from "../middleWare/adminAuth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/users", adminAuth, getAllUsers);
router.get("/user/:id", adminAuth, getUserById);   // ✔ NEW ROUTE
router.delete("/delete-user/:id", adminAuth, deleteUser);

export default router;

