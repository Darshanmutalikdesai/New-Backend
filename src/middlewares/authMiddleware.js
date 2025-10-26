import jwt from "jsonwebtoken";
import User from "../models/userModels.js";

export const protect = async (req, res, next) => {
  let token = req.headers.authorization;
  const JWT_SECRET = "myverystrongsecretkey";

  if (token && token.startsWith("Bearer ")) {
    token = token.split(" ")[1]; // Extract actual token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found." });

      req.user = user; // attach full user
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
  }

  return res.status(401).json({ message: "No token provided, authorization denied." });
};
