import { Router } from "express";
import {
  changePassword,
  login,
  logout,
  me
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { loginLimiter } from "../middlewares/login-rate-limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  loginSchema
} from "../schemas/auth.schemas.js";

const router = Router();

// Primero normaliza y valida el correo; luego limita los fallos por cuenta.
router.post("/login", validate(loginSchema), loginLimiter, login);
router.get("/me", authenticate, me);
router.post("/logout", logout);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

export default router;
