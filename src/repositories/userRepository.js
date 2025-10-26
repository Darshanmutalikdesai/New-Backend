// src/repositories/userRepository.js
import User from "../models/userModels.js";

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

export const updateUserOTP = async (email, otp, expiry) => {
  return await User.findOneAndUpdate(
    { email },
    { otp, otpExpiresAt: expiry },
    { new: true }
  );
};
