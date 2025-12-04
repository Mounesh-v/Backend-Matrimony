import Groom from "../model/Groom.js";
import Bride from "../model/Bride.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "matrimony/groomPhotos" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const registerGroom = async (req, res) => {
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

    const required = {
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

    for (const [k, v] of Object.entries(required)) {
      if (!v) return res.status(400).json({ message: `${k} is required` });
    }

    if (await Groom.findOne({ userId }))
      return res.status(400).json({ message: "Groom profile already exists" });

    if (await Bride.findOne({ userId }))
      return res.status(400).json({
        message: "You already have a bride profile. Cannot create groom profile.",
      });

    const groom = await Groom.create({
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

    if (req.files && req.files.length > 0) {
      const photoUrls = [];
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        photoUrls.push(url);
      }
      groom.photos = photoUrls;
      await groom.save();
    }

    res.status(201).json({ message: "Groom profile created successfully", groom });
  } catch (err) {
    console.error("registerGroom error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getGroomById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid groom ID" });

    let groom = await Groom.findById(id).populate("userId", "name email role");
    if (!groom) groom = await Groom.findOne({ userId: id }).populate("userId", "name email role");
    if (!groom) return res.status(404).json({ message: "Groom not found" });

    res.json(groom);
  } catch (err) {
    console.error("getGroomById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getGroomByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const groom = await Groom.findOne({ userId }).populate("userId", "name email role");
    if (!groom) return res.status(404).json({ message: "Groom profile not found" });
    res.json(groom);
  } catch (err) {
    console.error("getGroomByUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyGroom = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authorized" });
    const groom = await Groom.findOne({ userId }).populate("userId", "name email");
    if (!groom) return res.status(404).json({ message: "Groom profile not found" });
    res.json(groom);
  } catch (err) {
    console.error("getMyGroom error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkGroomExists = async (req, res) => {
  try {
    const groom = await Groom.findOne({ userId: req.params.userId });
    res.json({ exists: !!groom });
  } catch (err) {
    console.error("checkGroomExists error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGroom = async (req, res) => {
  try {
    const groomId = req.params.id;
    if (!mongoose.isValidObjectId(groomId)) return res.status(400).json({ message: "Invalid groom ID" });

    const groom = await Groom.findById(groomId);
    if (!groom) return res.status(404).json({ message: "Groom profile not found" });

    const requesterId = req.user?.userId || req.user?.id || req.user?._id;
    if (groom.userId.toString() !== requesterId.toString())
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
      if (req.body[field] !== undefined) groom[field] = field === "dob" ? new Date(req.body.dob) : req.body[field];
    });

    if (req.files && req.files.length > 0) {
      const newPhotos = [];
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        newPhotos.push(url);
      }
      groom.photos = [...(groom.photos || []), ...newPhotos];
    }

    await groom.save();
    res.json({ message: "Groom profile updated successfully", groom });
  } catch (err) {
    console.error("updateGroom error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listGrooms = async (req, res) => {
  try {
    const { page = 1, limit = 20, city, religion, minAge, maxAge } = req.query;
    const q = {};

    if (city) q.city = city;
    if (religion) q.religion = religion;

    if (minAge || maxAge) {
      const now = new Date();
      q.dob = {};
      if (minAge) q.dob.$lte = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
      if (maxAge) q.dob.$gte = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate() + 1);
    }

    const skip = (page - 1) * limit;
    const total = await Groom.countDocuments(q);
    const data = await Groom.find(q)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    res.json({ total, page: Number(page), limit: Number(limit), data });
  } catch (err) {
    console.error("listGrooms error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteGroom = async (req, res) => {
  try {
    const groom = await Groom.findByIdAndDelete(req.params.id);
    if (!groom) return res.status(404).json({ message: "Groom not found" });
    res.json({ message: "Groom deleted successfully" });
  } catch (err) {
    console.error("deleteGroom error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
