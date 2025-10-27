import express from "express";
import { registerTeam } from "../controllers/paperPresentationController.js";
// import { protect } from "../middleware/authMiddleware.js"; // optional if you use auth

const router = express.Router();

// register team route
router.post("/register", registerTeam);

export default router;
