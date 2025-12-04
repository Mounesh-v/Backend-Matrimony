import Bride from "../model/Bride.js";
import Groom from "../model/Groom.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// CLOUDINARY UPLOADER (BUFFER STREAM)
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "matrimony/bridePhotos" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// CREATE BRIDE PROFILE
export const registerBride = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      dob,
      religion,
      caste,
      motherTongue,
      heightCm,
      weightKg,
      education,
      occupation,
      income,
      city,
      state,
      country,
      about,
      phoneNumber,
    } = req.body;

    const requiredFields = {
      dob,
      religion,
      caste,
      motherTongue,
      heightCm,
      weightKg,
      education,
      occupation,
      income,
      city,
      state,
      country,
      about,
      phoneNumber,
    };

    for (const [key, val] of Object.entries(requiredFields)) {
      if (!val) return res.status(400).json({ message: `${key} is required` });
    }

    if (await Bride.findOne({ userId }))
      return res.status(400).json({ message: "Your bride profile already exists" });

    if (await Groom.findOne({ userId }))
      return res.status(400).json({
        message: "You already have a groom profile. Cannot create bride profile.",
      });

    const bride = await Bride.create({
      userId,
      dob: new Date(dob),
      religion,
      caste,
      motherTongue,
      heightCm,
      weightKg,
      education,
      occupation,
      income,
      city,
      state,
      country,
      about,
      phoneNumber,
      photos: [],
    });

    // CLOUDINARY UPLOAD
    if (req.files && req.files.length > 0) {
      const uploadedUrls = [];
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        uploadedUrls.push(url);
      }
      bride.photos = uploadedUrls;
      await bride.save();
    }

    res.status(201).json({ message: "Bride profile created successfully", bride });
  } catch (err) {
    console.error("registerBride error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET BRIDE BY PROFILE ID
export const getBrideById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid bride ID" });

    let bride = await Bride.findById(id).populate("userId", "name email role");

    if (!bride)
      bride = await Bride.findOne({ userId: id }).populate("userId", "name email role");

    if (!bride) return res.status(404).json({ message: "Bride not found" });

    res.json(bride);
  } catch (err) {
    console.error("getBrideById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET BRIDE BY USER ID
export const getBrideByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const bride = await Bride.findOne({ userId }).populate("userId", "name email role");

    if (!bride)
      return res.status(404).json({ message: "Bride profile not found" });

    res.json(bride);
  } catch (err) {
    console.error("getBrideByUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// CHECK BRIDE EXISTS
export const checkBrideExists = async (req, res) => {
  try {
    const bride = await Bride.findOne({ userId: req.params.userId });
    res.json({ exists: !!bride });
  } catch (err) {
    console.error("checkBrideExists error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE BRIDE PROFILE
export const updateBride = async (req, res) => {
  try {
    const brideId = req.params.id;

    if (!mongoose.isValidObjectId(brideId))
      return res.status(400).json({ message: "Invalid bride ID" });

    const bride = await Bride.findById(brideId);
    if (!bride)
      return res.status(404).json({ message: "Bride profile not found" });

    const requesterId = req.user?.userId || req.user?.id || req.user?._id;
    if (bride.userId.toString() !== requesterId.toString())
      return res.status(403).json({ message: "You are not allowed to update this profile" });

    const fields = [
      "dob",
      "religion",
      "caste",
      "motherTongue",
      "heightCm",
      "weightKg",
      "education",
      "occupation",
      "income",
      "city",
      "state",
      "country",
      "about",
      "phoneNumber",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined)
        bride[field] = field === "dob" ? new Date(req.body.dob) : req.body[field];
    });

    // CLOUDINARY IMAGE UPLOAD
    if (req.files && req.files.length > 0) {
      const uploadedUrls = [];
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        uploadedUrls.push(url);
      }
      bride.photos = [...bride.photos, ...uploadedUrls];
    }

    await bride.save();

    res.json({ message: "Bride profile updated successfully", bride });
  } catch (err) {
    console.error("updateBride error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// LIST BRIDES (PUBLIC)
export const listBrides = async (req, res) => {
  try {
    const { page = 1, limit = 20, city, religion, minAge, maxAge } = req.query;
    const q = {};

    if (city) q.city = city;
    if (religion) q.religion = religion;

    if (minAge || maxAge) {
      const now = new Date();
      q.dob = {};
      if (minAge)
        q.dob.$lte = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
      if (maxAge)
        q.dob.$gte = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate() + 1);
    }

    const skip = (page - 1) * limit;

    const total = await Bride.countDocuments(q);
    const data = await Bride.find(q)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    res.json({ total, page: Number(page), limit: Number(limit), data });
  } catch (err) {
    console.error("listBrides error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE BRIDE (ADMIN)
export const deleteBride = async (req, res) => {
  try {
    const bride = await Bride.findByIdAndDelete(req.params.id);

    if (!bride) return res.status(404).json({ message: "Bride not found" });

    res.json({ message: "Bride deleted successfully" });
  } catch (err) {
    console.error("deleteBride error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
