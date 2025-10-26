import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  _id: {
    type: String, // ✅ allow custom string IDs like eva0001
  },
  name: { type: String, required: true },
  type: { type: String, enum: ["solo", "team"], required: true },
  departments: [{ type: String }], // e.g., ["Aeronautical"]
  maxTeamSize: { type: Number, default: 1 }, // 1 for solo
  participants: [
    {
      avalancheId: String,
      name: String,
      email: String,
      department: String
    }
  ],
  teams: [
    {
      teamName: String,
      members: [
        {
          avalancheId: String,
          name: String,
          email: String,
          department: String
        }
      ]
    }
  ]
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);
export default Event;
