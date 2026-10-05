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
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión en el sistema
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso. La sesión se establece en una cookie.
 *       401:
 *         description: Credenciales inválidas.
 *       403:
 *         description: La cuenta no está habilitada.
 */
router.post("/login", validate(loginSchema), loginLimiter, login);
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtiene la sesión activa y el usuario autenticado
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Datos públicos del usuario de la sesión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     nombre: { type: string }
 *                     email: { type: string, format: email }
 *                     activo: { type: boolean }
 *                     debeCambiarPassword: { type: boolean }
 *                     ultimoAcceso: { type: string, format: date-time, nullable: true }
 *                     rol: { type: object, nullable: true, properties: { id: { type: integer }, codigo: { type: string }, nombre: { type: string } } }
 *                     ambito: { type: object, nullable: true, properties: { id: { type: integer }, tipo: { type: string }, codigo: { type: string }, nombre: { type: string } } }
 *                     permisos: { type: array, items: { type: string } }
 *       401:
 *         description: No autenticado o sesión no válida
 */
router.get("/me", authenticate, me);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cierra la sesión y elimina la cookie de autenticación
 *     tags: [Autenticación]
 *     responses:
 *       204:
 *         description: Sesión cerrada correctamente
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Cambia la contraseña del usuario autenticado
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Contraseña actualizada correctamente. }
 *       400:
 *         description: La contraseña actual es incorrecta
 *       401:
 *         description: No autenticado o sesión no válida
 *       422:
 *         description: La nueva contraseña no cumple la política o reutiliza la actual
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

export default router;
