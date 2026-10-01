import { createHash } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { normalizeEmail } from "../utils/credentials.js";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 10;

/**
 * Genera una clave por cuenta sin conservar el correo en texto plano.
 * El correo ya fue validado y normalizado antes de ejecutar el limitador,
 * pero se normaliza nuevamente para que esta función sea segura al reutilizarse.
 */
export function loginRateLimitKey(request) {
  const rawEmail = typeof request.body?.email === "string"
    ? request.body.email
    : "";
  const normalizedEmail = normalizeEmail(rawEmail);

  return createHash("sha256").update(normalizedEmail).digest("hex");
}

export const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_ATTEMPT_LIMIT,
  keyGenerator: loginRateLimitKey,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
      message: "Demasiados intentos para esta cuenta. Intente nuevamente más tarde."
    }
  }
});
