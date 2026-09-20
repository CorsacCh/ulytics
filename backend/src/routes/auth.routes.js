import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  changePassword,
  login,
  logout,
  me
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  loginSchema
} from "../schemas/auth.schemas.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
      message: "Demasiados intentos. Intente nuevamente más tarde."
    }
  }
});

router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", authenticate, me);
router.post("/logout", logout);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

export default router;
