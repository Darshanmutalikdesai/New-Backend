import express from "express";
import {
  resetPassword,
  registerUser,
  loginUser,
  verifyOTP,
  requestPasswordReset,
  verifyResetOTP,
  getProfile, // 👈 add this
  updatePaymentStatus 
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);

// 🔑 Password Reset
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

// 🔐 Profile
router.get("/profile", protect, getProfile);

//payment
router.put("/update-payment", updatePaymentStatus);

export default router;
