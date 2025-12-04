import express from "express";
import {
  adminSendOtp,
  adminVerifyOtp,
  sendOtp,
  testEmail,
  verifyOtp,
} from "../controller/Otp.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/admin-send-otp", adminSendOtp);
router.post("/admin-verify-otp", adminVerifyOtp);
router.get("/test-email", testEmail);

export default router;
