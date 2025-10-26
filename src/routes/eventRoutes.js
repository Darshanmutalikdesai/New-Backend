import express from "express";
import { registerForEvent, exportCSV } from "../controllers/eventController.js";

const router = express.Router();

// Register solo/team
router.post("/register/:id", registerForEvent);

// Export CSV for admin
router.get("/export", exportCSV);

export default router;
