import mongoose from "mongoose";

const brideSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    dob: { type: Date, required: true },
    religion: { type: String, required: true },
    caste: { type: String, required: true },
    motherTongue: { type: String, required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    education: { type: String, required: true },
    occupation: { type: String, required: true },
    income: { type: String, required: true },

    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },

    about: { type: String, required: true },

    phoneNumber: { type: String, required: true },

    photos: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model("Bride", brideSchema);
