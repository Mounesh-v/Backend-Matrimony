import jwt from "jsonwebtoken";
import User from "../model/User.js";
import Groom from "../model/Groom.js";
import Bride from "../model/Bride.js";

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's an admin token
    if (decoded.admin) {
      req.user = { admin: true, email: decoded.email };
      return next();
    }

    // Try to find user first
    let user = await User.findById(decoded.id).select("-password");

    // If not found in User, try Groom collection
    if (!user) {
      user = await Groom.findById(decoded.id).select("-password");
    }

    // If not found in Groom, try Bride collection
    if (!user) {
      user = await Bride.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default protect;
