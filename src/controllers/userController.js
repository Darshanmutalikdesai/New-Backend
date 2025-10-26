import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModels.js";
import { verifyOTPService } from "../services/userService.js";

// 📧 Reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "avalanche25@git.edu",
    pass: "rmwdnakckgwuxoxd",
  },
});

// 📧 Space-themed email template generator
const spaceMail = (title, message, otp, name) => `
  <div style="
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(135deg, #0b0f19, #141a2a);
    color: #e0e0e0;
    padding: 40px 25px;
    border-radius: 12px;
    box-shadow: 0 0 25px rgba(0, 255, 255, 0.2);
    max-width: 600px;
    margin: auto;
    border: 1px solid rgba(0, 255, 255, 0.1);
  ">
    <div style="text-align: center; margin-bottom: 25px;">
      <h1 style="
        color: #00ffff;
        letter-spacing: 2px;
        text-shadow: 0 0 8px #00ffff;
        font-size: 28px;
        margin: 0;
      ">${title}</h1>
      <p style="color: #aaa; margin-top: 5px;">Secure Identity System</p>
    </div>

    <div style="
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 10px;
      padding: 25px;
      text-align: center;
    ">
      <h2 style="color: #00e0ff; margin-bottom: 15px;">Hey ${name},</h2>
      <p style="font-size: 15px; line-height: 1.6;">${message}</p>

      <div style="
        margin: 25px auto;
        background: rgba(0, 255, 255, 0.08);
        border: 1px solid rgba(0, 255, 255, 0.3);
        border-radius: 12px;
        padding: 18px 0;
        width: 250px;
        text-align: center;
      ">
        <span style="
          font-size: 32px;
          color: #00ffff;
          font-weight: bold;
          letter-spacing: 8px;
          text-shadow: 0 0 10px #00ffff;
        ">${otp}</span>
      </div>

      <p style="font-size: 14px; color: #aaa;">
        ⏳ Valid for <b>5 minutes</b> • Do not share this code with anyone.
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <p style="font-size: 13px; color: #777;">
        If you didn’t request this, you can safely ignore it.<br/>
        <span style="color: #00ffff;">Avalanche Security Systems</span> 🚀
      </p>
    </div>
  </div>
`;

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {
    const { name, email, pNumber, password, rollNumber, institute } = req.body;

    if (!name || !email || !pNumber || !password || !rollNumber || !institute) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists." });

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // Save user
    const newUser = new User({
      name,
      email,
      pNumber,
      password: hashedPassword,
      rollNumber,
      institute,
      otp,
      otpExpiresAt,
      isVerified: false,
      payment: false, // ✅ Added payment flag
    });

    await newUser.save();

    // 📧 Send Space-styled email
    await transporter.sendMail({
      from: `"Avalanche 2024 ❄️" <avalanche25@git.edu>`,
      to: email,
      subject: "🚀 Avalanche 2025 - Verify Your Account",
      html: spaceMail(
        "AVALANCHE 2025",
        "Welcome aboard, cadet! 🚀 Use the OTP below to verify your account and begin your cosmic journey with Avalanche.",
        otp,
        name
      ),
    });

    res.status(200).json({
      message: `OTP sent to your email ${email}. Please verify to complete registration.`,
    });
  } catch (error) {
    console.error("Error in registerUser:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

//================LOGIN=========================
const JWT_EXPIRES_IN = "1d";
const JWT_SECRET = "myverystrongsecretkey";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Generate JWT (encode only userId)
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(200).json({
      message: "Login successful.",
      token,
      payment: user.payment, // ✅ Include payment status in login response
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    return res.status(500).json({ message: "Server error." });
  }
};

//===============GET USER================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error in getProfile:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= VERIFY OTP =================
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await verifyOTPService(email, otp);

    return res.status(200).json({
      message: "User verified successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        payment: user.payment, // ✅ Include payment status
      },
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

// ================= REQUEST PASSWORD RESET =================
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save();

    await transporter.sendMail({
      from: `"Avalanche 2024 ❄️" <avalanche25@git.edu>`,
      to: email,
      subject: "🔑 Avalanche 2024 - Password Reset Code",
      html: spaceMail(
        "RESET PASSWORD",
        "We’ve received a request to reset your password. Use the OTP below to continue:",
        otp,
        user.name
      ),
    });

    res.json({ message: "Password reset OTP sent to email." });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ================= VERIFY RESET OTP =================
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.resetOTP !== otp || user.resetOTPExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    res.json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    console.error("Error in verifyResetOTP:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.resetOTP !== otp || user.resetOTPExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error in resetPassword:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ================= UPDATE PAYMENT STATUS =================
export const updatePaymentStatus = async (req, res) => {
  try {
    const { email, status } = req.body; // status = true or false

    if (!email || typeof status !== "boolean") {
      return res
        .status(400)
        .json({ message: "Email and valid status are required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    user.payment = status;
    await user.save();

    res.json({
      message: `Payment status updated to ${status ? "Paid" : "Unpaid"}.`,
      payment: user.payment,
    });
  } catch (error) {
    console.error("Error in updatePaymentStatus:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};
