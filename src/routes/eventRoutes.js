// eventRoutes.js
import express from "express";
import { registerTeam } from "../controllers/eventRegisterController.js";

const router = express.Router();
router.post("/:id/register", registerTeam);
export default router;
