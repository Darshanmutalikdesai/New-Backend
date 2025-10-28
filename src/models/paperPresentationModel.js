import mongoose from "mongoose";

const paperPresentationSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      enum: [
        "Aeronautical",
        "Architecture",
        "Physics",
        "Chemistry",
        "B. Sc. (PCM)",
        "Mathematics",
        "Civil Engineering",
        "Computer Science",
        "Electronics & Communications (EC)",
        "Information Science (IS)",
        "MBA",
        "MCA",
        "Mechanical Engineering",
        "AI-ML",
      ],
    },
    team: [
      {
       
        avalancheId: {
          type: String,
          required: true, // This is the main identifier
        },
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        isVerified: {
          type: Boolean,
          default: false,
        },
        hasPaid: {
          type: Boolean,
          default: false,
        },
      },
    ],
    mode: {
      type: String,
      required: true,
      enum: ["Online", "Offline"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for faster queries
paperPresentationSchema.index({ department: 1, "team.avalancheId": 1 });

const PaperPresentation = mongoose.model(
  "Paper",
  paperPresentationSchema
);

export default PaperPresentation;