import express from "express";
import Otp from "../model/Otp.js";
import otpGenerator from "otp-generator";
import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();
import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------------------- SEND USER OTP ----------------------
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
    });

    // SEND EMAIL USING RESEND
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your OTP Verification – Thirukkalyanam Matrimony",
      html: `
        <h2>Your Verification OTP</h2>
        <h1>${otp}</h1>
        <p>Valid for 2 minutes.</p>
      `,
    });

    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------- VERIFY USER OTP ----------------------
export const verifyOtp = async (req, res) => {
  try {
    const { name, email, password, role, otp, profilePic } = req.body;

    if (!name || !email || !password || !role || !otp) {
      return res.status(400).json({ success: false, message: "Missing fields" });
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

// ---------------------- SEND ADMIN OTP ----------------------
export const adminSendOtp = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(400).json({ success: false, message: "Invalid admin credentials" });
    }

    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
    });

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: "Your Admin Login OTP",
      html: `
        <h2>Admin Login OTP</h2>
        <h1>${otp}</h1>
        <p>Valid for 2 minutes.</p>
      `,
    });

    await Otp.create({
      email: process.env.ADMIN_EMAIL,
      otp,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });

    return res.json({ success: true, message: "Admin OTP sent" });
  } catch (err) {
    console.error("ADMIN OTP SEND ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------- VERIFY ADMIN OTP ----------------------
export const adminVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const validOtp = await Otp.findOne({ email, otp });

    if (!validOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (validOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    await Otp.deleteMany({ email });

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

// ---------------------- TEST EMAIL ENDPOINT ----------------------
export const testEmail = async (req, res) => {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.FROM_EMAIL,
      subject: "Test Email",
      text: "Resend email API works perfectly!",
    });

    res.send("Email sent successfully!");
  } catch (err) {
    res.status(500).send(err.message);
  }
};
