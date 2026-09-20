import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  SESSION_COOKIE_NAME,
  getClearCookieOptions,
  getJwtExpiration,
  getJwtSecret,
  getSessionCookieOptions
} from "../config/auth.js";
import { AuditoriaUsuario } from "../persistence/models/index.js";
import { findUserByEmail, serializeUser } from "../services/user.service.js";
import { AppError } from "../utils/app-error.js";
import { assertPasswordPolicy } from "../utils/credentials.js";

export async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    const user = await findUserByEmail(email);
    const validPassword = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!user || !validPassword || !user.activo) {
      throw new AppError(
        "Correo o contraseña incorrectos.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    if (!user.rol?.activo || !user.ambito?.activo) {
      throw new AppError("La cuenta no está habilitada.", 403, "ACCOUNT_DISABLED");
    }

    const token = jwt.sign({}, getJwtSecret(), {
      subject: String(user.id_usuario),
      expiresIn: getJwtExpiration()
    });

    user.ultimo_acceso = new Date();
    await user.save();

    response.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response.json({ user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
}

export function me(request, response) {
  return response.json({ user: request.auth.publicUser });
}

export function logout(_request, response) {
  response.clearCookie(SESSION_COOKIE_NAME, getClearCookieOptions());
  return response.status(204).send();
}

export async function changePassword(request, response, next) {
  try {
    const { currentPassword, newPassword } = request.body;
    const user = request.auth.user;
    const currentPasswordIsValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!currentPasswordIsValid) {
      throw new AppError(
        "La contraseña actual es incorrecta.",
        400,
        "INVALID_CURRENT_PASSWORD"
      );
    }

    if (await bcrypt.compare(newPassword, user.password_hash)) {
      throw new AppError(
        "La nueva contraseña debe ser diferente de la contraseña temporal.",
        422,
        "PASSWORD_REUSE"
      );
    }

    assertPasswordPolicy(newPassword);
    user.password_hash = await bcrypt.hash(newPassword, 12);
    user.debe_cambiar_password = false;
    user.password_actualizado_at = new Date();
    await user.save();

    await AuditoriaUsuario.create({
      realizado_por_usuario_id: user.id_usuario,
      usuario_afectado_id: user.id_usuario,
      accion: "PASSWORD_CHANGED"
    });

    return response.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    return next(error);
  }
}
