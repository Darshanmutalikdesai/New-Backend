import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  deptCode: { type: String, required: true, unique: true }, // e.g. "CSE"
  name: { type: String, required: true }, // e.g. "Computer Science Engineering"
  head: String,
  email: String
}, { timestamps: true });

export default mongoose.model("Department", departmentSchema);
