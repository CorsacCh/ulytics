import { Router } from "express";
import {
  createUser,
  getRoles,
  getScopes,
  getUsers,
  updateUser,
  updateUserStatus
} from "../controllers/admin-users.controller.js";
import {
  authenticate,
  requirePasswordChanged,
  requirePermission
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamsSchema
} from "../schemas/auth.schemas.js";

const router = Router();

router.use(authenticate, requirePasswordChanged);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Lista los usuarios del sistema
 *     tags: [Administración de usuarios]
 *     responses:
 *       200:
 *         description: Usuarios disponibles con rol, ámbito y permisos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       nombre: { type: string }
 *                       email: { type: string, format: email }
 *                       activo: { type: boolean }
 *                       debeCambiarPassword: { type: boolean }
 *                       ultimoAcceso: { type: string, format: date-time, nullable: true }
 *                       rol: { type: object, nullable: true }
 *                       ambito: { type: object, nullable: true }
 *                       permisos: { type: array, items: { type: string } }
 *       401:
 *         description: No autenticado o sesión no válida
 *       403:
 *         description: No tiene permiso para consultar usuarios
 */
router.get("/users", requirePermission("USUARIOS_VER"), getUsers);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Crea un usuario
 *     tags: [Administración de usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, temporaryPassword, rolId]
 *             properties:
 *               nombre: { type: string }
 *               email: { type: string, format: email }
 *               temporaryPassword: { type: string }
 *               rolId: { type: integer }
 *               ambitoId: { type: integer }
 *               car_codigo: { type: string }
 *               id_macrounidad: { type: string }
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { type: object, properties: { id: { type: integer }, nombre: { type: string }, email: { type: string }, activo: { type: boolean }, debeCambiarPassword: { type: boolean }, rol: { type: object, nullable: true }, ambito: { type: object, nullable: true }, permisos: { type: array, items: { type: string } } } }
 *       401:
 *         description: No autenticado o sesión no válida
 *       403:
 *         description: No tiene permiso para crear usuarios
 */
router.post(
  "/users",
  requirePermission("USUARIOS_CREAR"),
  validate(createUserSchema),
  createUser
);
/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: Actualiza datos y ámbito de un usuario
 *     tags: [Administración de usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               rolId: { type: integer }
 *               ambitoId: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { type: object, properties: { id: { type: integer }, nombre: { type: string }, email: { type: string }, activo: { type: boolean }, debeCambiarPassword: { type: boolean }, rol: { type: object, nullable: true }, ambito: { type: object, nullable: true }, permisos: { type: array, items: { type: string } } } }
 *       401:
 *         description: No autenticado o sesión no válida
 *       403:
 *         description: No tiene permiso para editar usuarios
 */
router.patch(
  "/users/:id",
  requirePermission("USUARIOS_EDITAR"),
  validate(userIdParamsSchema, "params"),
  validate(updateUserSchema),
  updateUser
);
/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Activa o desactiva un usuario
 *     tags: [Administración de usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activo]
 *             properties:
 *               activo: { type: boolean }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { type: object, properties: { id: { type: integer }, nombre: { type: string }, email: { type: string }, activo: { type: boolean }, debeCambiarPassword: { type: boolean }, rol: { type: object, nullable: true }, ambito: { type: object, nullable: true }, permisos: { type: array, items: { type: string } } } }
 *       401:
 *         description: No autenticado o sesión no válida
 *       403:
 *         description: No tiene permiso para cambiar el estado de usuarios
 */
router.patch(
  "/users/:id/status",
  requirePermission("USUARIOS_CAMBIAR_ESTADO"),
  validate(userIdParamsSchema, "params"),
  validate(updateUserStatusSchema),
  updateUserStatus
);
/**
 * @swagger
 * /admin/roles:
 *   get:
 *     summary: Lista los roles activos
 *     tags: [Administración de usuarios]
 *     responses:
 *       200:
 *         description: Roles disponibles para asignación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_rol: { type: integer }
 *                       codigo: { type: string }
 *                       nombre: { type: string }
 *       401:
 *         description: No autenticado o sesión no válida
 *       403:
 *         description: No tiene permiso para consultar roles
 */
router.get("/roles", requirePermission("USUARIOS_VER"), getRoles);

/**
 * @swagger
 * /admin/scopes:
 *   get:
 *     summary: Lista los ámbitos académicos activos
 *     tags: [Administración de usuarios]
 *     responses:
 *       200:
 *         description: Ámbitos disponibles para asignación a usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scopes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_ambito: { type: integer }
 *                       tipo: { type: string }
 *                       codigo: { type: string }
 *                       nombre: { type: string }
 *                       ambito_padre_id: { type: integer, nullable: true }
 *       401:
 *         description: No autenticado o sesión no válida
 *       403:
 *         description: No tiene permiso para consultar ámbitos
 */
router.get("/scopes", requirePermission("USUARIOS_VER"), getScopes);

export default router;
