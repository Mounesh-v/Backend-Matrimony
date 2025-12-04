import express from "express";
import Otp from "../model/Otp.js";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject:
        "Your OTP Verification – Thirukkalyanam Matrimony Service Centre",
      html: `
  <div style="font-family: Arial, sans-serif; padding: 25px; background: #f8f2f7; border-radius: 10px;">
    
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #C2185B; margin-bottom: 5px;">Thirukkalyanam Matrimony Service Centre</h2>
      <p style="color: #555; font-size: 14px;">
        Trusted Matrimonial Service for Over 30 Years
      </p>
    </div>

    <p style="font-size: 15px; color: #333;">
      Dear User,<br><br>
      Thank you for choosing our Matrimony Service. Your OTP for account verification is:
    </p>

    <div style="text-align: center; margin: 25px 0;">
      <h1 style="
        background: #C2185B; 
        color: white;
        display: inline-block;
        padding: 12px 30px;
        border-radius: 8px;
        letter-spacing: 4px;
      ">
        ${otp}
      </h1>
    </div>

    <p style="font-size: 15px; color: #555; line-height: 24px;">
      Please enter this OTP in your app to complete your verification.
      This OTP is valid for <strong>2 minutes</strong>.
    </p>

    <hr style="margin: 25px 0; border-top: 1px solid #ddd;" />

    <h3 style="color: #C2185B; margin-bottom: 8px;">About Our Service</h3>

    <p style="font-size: 14px; color: #444; line-height: 22px;">
      Our service has been helping all communities for over 30 years, arranging suitable matches exactly as you expect.<br>
      Through our Thirukkalyanam Matrimony Centre, we have arranged many successful marriages. You can choose your preferred match from our available profiles.
    </p>

    <h4 style="color: #C2185B; margin-top: 15px;">Special Features</h4>
    <ul style="color: #444; font-size: 14px; line-height: 22px;">
      <li>Profiles from Doctors, Engineers, Business Owners</li>
      <li>Government & Private Employees</li>
      <li>Bank Staff, IT Professionals & More</li>
      <li>Second Marriage profiles arranged with care</li>
    </ul>

    <h4 style="color: #C2185B; margin-top: 15px;">Service Charges</h4>
    <p style="font-size: 14px; color: #444;">
      ₹50/- per Horoscope / Biodata you choose.
    </p>

    <p style="margin-top: 25px; font-size: 13px; color: #888; text-align: center;">
      Thank you for trusting Thirukkalyanam Matrimony Service Centre.
    </p>

  </div>
  `,
    });

    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 min expiry
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { name, email, password, role, otp, profilePic } = req.body;

    if (!name || !email || !password || !role || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const validOtp = await Otp.findOne({ email, otp: String(otp) });

    if (!validOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (validOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPass,
      role,
      profilePic,
    });

    await Otp.deleteMany({ email });

    return res.json({ success: true, message: "Signup successful", user });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminSendOtp = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate admin credentials
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid admin credentials" });
    }

    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Your Admin Login OTP – Thirukkalyanam Matrimony",
      html: `
        <h2>Your Admin Login OTP</h2>
        <p>Use this OTP to login:</p>
        <h1>${otp}</h1>
        <p>Valid for 2 minutes.</p>
      `,
    });

    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
    });

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("ADMIN OTP SEND ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const validOtp = await Otp.findOne({ email, otp });

    if (!validOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (validOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    await Otp.deleteMany({ email });

    // Generate JWT for admin
    const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      success: true,
      message: "Admin Login Successful",
      token,
    });
  } catch (err) {
    console.error("ADMIN OTP VERIFY ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
