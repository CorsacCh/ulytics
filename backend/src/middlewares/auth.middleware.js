import jwt from "jsonwebtoken";
import { SESSION_COOKIE_NAME, getJwtSecret } from "../config/auth.js";
import { findUserById, serializeUser } from "../services/user.service.js";
import { AppError } from "../utils/app-error.js";

export async function authenticate(request, _response, next) {
  try {
    const token = request.cookies?.[SESSION_COOKIE_NAME];
    if (!token) throw new AppError("Sesión no válida.", 401, "UNAUTHENTICATED");

    const payload = jwt.verify(token, getJwtSecret());
    const user = await findUserById(Number(payload.sub));

    if (!user || !user.activo || !user.rol?.activo || !user.ambito?.activo) {
      throw new AppError("Sesión no válida.", 401, "UNAUTHENTICATED");
    }

    const publicUser = serializeUser(user);
    request.auth = {
      user,
      publicUser,
      permissions: new Set(publicUser.permisos)
    };
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError("Sesión no válida.", 401, "UNAUTHENTICATED"));
  }
}

export function requirePasswordChanged(request, _response, next) {
  if (request.auth.user.debe_cambiar_password) {
    return next(
      new AppError(
        "Debe cambiar la contraseña temporal antes de continuar.",
        403,
        "PASSWORD_CHANGE_REQUIRED"
      )
    );
  }
  return next();
}

export function requirePermission(permissionCode) {
  return (request, _response, next) => {
    if (!request.auth.permissions.has(permissionCode)) {
      return next(new AppError("Acceso no autorizado.", 403, "FORBIDDEN"));
    }
    return next();
  };
}

export const authMiddleware = authenticate;

export function authorize(roles = []) {
  return (request, _response, next) => {
    const userRoleCode = request.auth?.user?.rol?.codigo;
    if (!userRoleCode) {
      return next(new AppError("Acceso no autorizado.", 403, "FORBIDDEN"));
    }
    const match = roles.some(role => role.toUpperCase() === userRoleCode.toUpperCase());
    if (!match) {
      return next(new AppError("Acceso no autorizado.", 403, "FORBIDDEN"));
    }
    return next();
  };
}
