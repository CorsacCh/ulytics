import bcrypt from "bcryptjs";
import { sequelize } from "../persistence/database/database.js";
import {
  AmbitoAcademico,
  AuditoriaUsuario,
  Rol,
  Usuario
} from "../persistence/models/index.js";
import {
  findDuplicateEmail,
  findUserById,
  listUsers,
  serializeUser
} from "../services/user.service.js";
import { AppError } from "../utils/app-error.js";
import { assertPasswordPolicy } from "../utils/credentials.js";
import { assertRoleScopeCompatibility } from "../utils/role-scope.js";

async function rollbackIfActive(transaction) {
  if (transaction && !transaction.finished) {
    try {
      await transaction.rollback();
    } catch {
      // Conserva el error original para el middleware de errores.
    }
  }
}

async function getRoleAndScope(rolId, ambitoId, transaction) {
  const [role, scope] = await Promise.all([
    Rol.findByPk(rolId, { transaction }),
    AmbitoAcademico.findByPk(ambitoId, { transaction })
  ]);

  if (!role?.activo) throw new AppError("El rol no es válido.", 422, "INVALID_ROLE");
  if (!scope?.activo) {
    throw new AppError("El ámbito no es válido.", 422, "INVALID_SCOPE");
  }

  assertRoleScopeCompatibility(role.codigo, scope.tipo);
  return { role, scope };
}

export async function getUsers(_request, response, next) {
  try {
    const users = await listUsers();
    return response.json({ users: users.map(serializeUser) });
  } catch (error) {
    return next(error);
  }
}

export async function createUser(request, response, next) {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const { nombre, email, temporaryPassword, rolId, ambitoId } = request.body;
    assertPasswordPolicy(temporaryPassword);
    await getRoleAndScope(rolId, ambitoId, transaction);

    if (await findDuplicateEmail(email)) {
      throw new AppError("El correo ya está registrado.", 409, "EMAIL_EXISTS");
    }

    const user = await Usuario.create(
      {
        nombre,
        email,
        password_hash: await bcrypt.hash(temporaryPassword, 12),
        rol_id: rolId,
        ambito_id: ambitoId,
        activo: true,
        debe_cambiar_password: true
      },
      { transaction }
    );

    await AuditoriaUsuario.create(
      {
        realizado_por_usuario_id: request.auth.user.id_usuario,
        usuario_afectado_id: user.id_usuario,
        accion: "USER_CREATED",
        detalle: { rolId, ambitoId }
      },
      { transaction }
    );

    await transaction.commit();
    const createdUser = await findUserById(user.id_usuario);
    return response.status(201).json({ user: serializeUser(createdUser) });
  } catch (error) {
    await rollbackIfActive(transaction);
    return next(error);
  }
}

export async function updateUser(request, response, next) {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const user = await Usuario.findByPk(request.params.id, { transaction });
    if (!user) throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");

    const isCurrentUser = user.id_usuario === request.auth.user.id_usuario;
    const changesOwnRole =
      request.body.rolId !== undefined && request.body.rolId !== user.rol_id;
    const changesOwnScope =
      request.body.ambitoId !== undefined && request.body.ambitoId !== user.ambito_id;

    if (isCurrentUser && (changesOwnRole || changesOwnScope)) {
      throw new AppError(
        "No puede cambiar su propio rol ni ámbito académico.",
        422,
        "CANNOT_CHANGE_OWN_ACCESS"
      );
    }

    const nextRoleId = request.body.rolId ?? user.rol_id;
    const nextScopeId = request.body.ambitoId ?? user.ambito_id;
    await getRoleAndScope(nextRoleId, nextScopeId, transaction);

    if (request.body.nombre !== undefined) user.nombre = request.body.nombre;
    user.rol_id = nextRoleId;
    user.ambito_id = nextScopeId;
    await user.save({ transaction });

    await AuditoriaUsuario.create(
      {
        realizado_por_usuario_id: request.auth.user.id_usuario,
        usuario_afectado_id: user.id_usuario,
        accion: "USER_UPDATED",
        detalle: { rolId: nextRoleId, ambitoId: nextScopeId }
      },
      { transaction }
    );

    await transaction.commit();
    const updatedUser = await findUserById(user.id_usuario);
    return response.json({ user: serializeUser(updatedUser) });
  } catch (error) {
    await rollbackIfActive(transaction);
    return next(error);
  }
}

export async function updateUserStatus(request, response, next) {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const targetId = Number(request.params.id);
    if (targetId === request.auth.user.id_usuario && !request.body.activo) {
      throw new AppError(
        "No puede deshabilitar su propia cuenta.",
        422,
        "CANNOT_DISABLE_SELF"
      );
    }

    const user = await Usuario.findByPk(targetId, { transaction });
    if (!user) throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");

    user.activo = request.body.activo;
    await user.save({ transaction });

    await AuditoriaUsuario.create(
      {
        realizado_por_usuario_id: request.auth.user.id_usuario,
        usuario_afectado_id: user.id_usuario,
        accion: request.body.activo ? "USER_ENABLED" : "USER_DISABLED"
      },
      { transaction }
    );

    await transaction.commit();
    const updatedUser = await findUserById(user.id_usuario);
    return response.json({ user: serializeUser(updatedUser) });
  } catch (error) {
    await rollbackIfActive(transaction);
    return next(error);
  }
}

export async function getRoles(_request, response, next) {
  try {
    const roles = await Rol.findAll({
      where: { activo: true },
      attributes: ["id_rol", "codigo", "nombre"],
      order: [["nombre", "ASC"]]
    });
    return response.json({ roles });
  } catch (error) {
    return next(error);
  }
}

export async function getScopes(_request, response, next) {
  try {
    const scopes = await AmbitoAcademico.findAll({
      where: { activo: true },
      attributes: ["id_ambito", "tipo", "codigo", "nombre", "ambito_padre_id"],
      order: [["tipo", "ASC"], ["nombre", "ASC"]]
    });
    return response.json({ scopes });
  } catch (error) {
    return next(error);
  }
}
