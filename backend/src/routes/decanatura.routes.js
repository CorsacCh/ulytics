import { Router } from "express";
import { getFacultyCareers } from "../controllers/decanatura.controller.js";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
  requirePermission
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(
  authenticate,
  requirePasswordChanged,
  authorize(["DECANO"]),
  requirePermission("DASHBOARD_DECANO_VER")
);

router.get("/carreras", getFacultyCareers);

export default router;
