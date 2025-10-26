import mongoose from "mongoose";

const paperPresentationSchema = new mongoose.Schema({
  eventName: { type: String, default: "Paper Presentation" },
  mode: { type: String, enum: ["Online", "Offline", "Hybrid"], default: "Hybrid" },
  department: { type: String, required: true },
  team: [
    {
      userId: { type: String, required: true },
      name: { type: String },
      email: { type: String },
      isVerified: { type: Boolean, default: false },
      payment: { type: Boolean, default: false },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const PaperPresentation = mongoose.model("PaperPresentation", paperPresentationSchema);
export default PaperPresentation;
