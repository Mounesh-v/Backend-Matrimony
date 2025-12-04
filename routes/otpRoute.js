import express from "express";
import { adminSendOtp, adminVerifyOtp, sendOtp, verifyOtp } from "../controller/Otp.js";


const router = express.Router();

router.post("/send-otp",sendOtp);
router.post("/verify-otp",verifyOtp);
router.post("/admin-send-otp",adminSendOtp);
router.post("/admin-verify-otp",adminVerifyOtp);

export default router;