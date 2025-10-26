import mongoose from "mongoose";
import Counter from "./counterModel.js";

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // Custom Avalanche ID (ava0001, ava0002…)
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    department: { 
      type: String, 
    }, // optional deptCode

    // 🔹 OTP for registration/verification
    otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // 💳 Payment status flag
    payment: {
      type: Boolean,
      default: false, // false by default
    },

    // 🔹 Password reset fields
    resetOTP: {
      type: String,
    },
    resetOTPExpires: { // ✅ updated name to match your controllers
      type: Date,
    },
  },
  { timestamps: true }
);

// ✅ Auto-generate custom Avalanche ID before saving
userSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const seqNum = counter.seq.toString().padStart(4, "0"); // → 0001
    this._id = `ava${seqNum}`;
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
