import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "groom", "bride"],
  },
  profilePic: {
    type: String,
    default: "",
  },
});

export default mongoose.model("User", userSchema);
