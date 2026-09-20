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

router.get("/users", requirePermission("USUARIOS_VER"), getUsers);
router.post(
  "/users",
  requirePermission("USUARIOS_CREAR"),
  validate(createUserSchema),
  createUser
);
router.patch(
  "/users/:id",
  requirePermission("USUARIOS_EDITAR"),
  validate(userIdParamsSchema, "params"),
  validate(updateUserSchema),
  updateUser
);
router.patch(
  "/users/:id/status",
  requirePermission("USUARIOS_CAMBIAR_ESTADO"),
  validate(userIdParamsSchema, "params"),
  validate(updateUserStatusSchema),
  updateUserStatus
);
router.get("/roles", requirePermission("USUARIOS_VER"), getRoles);
router.get("/scopes", requirePermission("USUARIOS_VER"), getScopes);

export default router;
