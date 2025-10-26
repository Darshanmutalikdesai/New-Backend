// src/services/userService.js
import { findUserByEmail, createUser, updateUserOTP } from "../repositories/userRepository.js";
import bcrypt from "bcryptjs";

export const registerUserService = async ({ name, email, password, otp }) => {
  // Check if user exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists with this email.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Set OTP expiry (5 min)
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  // Create user
  const newUser = await createUser({
    name,
    email,
    password: hashedPassword,
    otp,
    otpExpiresAt: otpExpiry,
    isVerified: false,
  });

  return newUser;
};

export const saveUserOTPService = async (email, otp) => {
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  return await updateUserOTP(email, otp, otpExpiry);
};

export const verifyOTPService = async (email, otp) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.isVerified) {
    throw new Error("User already verified.");
  }

  if (user.otp !== otp) {
    throw new Error("Invalid OTP.");
  }

  if (user.otpExpiresAt < new Date()) {
    throw new Error("OTP expired.");
  }

  // ✅ Mark user as verified
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return user;
};

