import express from "express";
import { registerTeam } from "../controllers/paperPresentationController.js";

const router = express.Router();

// POST /api/paper-presentation/register
router.post("/register", registerTeam);

export default router;
