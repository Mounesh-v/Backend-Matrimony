import mongoose from "mongoose";

const groomSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dob: { type: Date },
    phoneNumber: { type: String },
    religion: { type: String },
    caste: { type: String },
    motherTongue: { type: String },
    heightCm: { type: Number },
    weightKg: { type: Number },
    education: { type: String },
    occupation: { type: String },
    income: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    about: { type: String },
    photos: [{ type: String }], // store URLs or file paths
  },
  { timestamps: true }
);

export default mongoose.model("Groom", groomSchema);
