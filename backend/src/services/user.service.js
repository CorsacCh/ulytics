import { Op, fn, col, where } from "sequelize";
import {
  AmbitoAcademico,
  Carrera,
  Macrounidad,
  Permiso,
  Rol,
  Usuario
} from "../persistence/models/index.js";
import { AppError } from "../utils/app-error.js";
import { expectedScopeType } from "../utils/role-scope.js";

export const userIncludes = [
  {
    model: Rol,
    as: "rol",
    include: [
      {
        model: Permiso,
        as: "permisos",
        through: { attributes: [] }
      }
    ]
  },
  { model: AmbitoAcademico, as: "ambito" }
];

export function findUserByEmail(email, options = {}) {
  return Usuario.findOne({
    where: where(fn("lower", col("Usuario.email")), email.toLowerCase()),
    include: userIncludes,
    ...options
  });
}

export function findUserById(id, options = {}) {
  return Usuario.findByPk(id, { include: userIncludes, ...options });
}

export function serializeUser(user) {
  const plain = user.get({ plain: true });
  return {
    id: plain.id_usuario,
    nombre: plain.nombre,
    email: plain.email,
    activo: plain.activo,
    debeCambiarPassword: plain.debe_cambiar_password,
    ultimoAcceso: plain.ultimo_acceso,
    rol: plain.rol
      ? {
          id: plain.rol.id_rol,
          codigo: plain.rol.codigo,
          nombre: plain.rol.nombre
        }
      : null,
    ambito: plain.ambito
      ? {
          id: plain.ambito.id_ambito,
          tipo: plain.ambito.tipo,
          codigo: plain.ambito.codigo,
          nombre: plain.ambito.nombre
        }
      : null,
    permisos: plain.rol?.permisos?.map((permission) => permission.codigo) || []
  };
}

export function listUsers() {
  return Usuario.findAll({
    include: userIncludes,
    order: [["nombre", "ASC"]]
  });
}

export function findDuplicateEmail(email, excludedUserId) {
  const conditions = [where(fn("lower", col("email")), email.toLowerCase())];
  if (excludedUserId) conditions.push({ id_usuario: { [Op.ne]: excludedUserId } });
  return Usuario.findOne({ where: { [Op.and]: conditions } });
}

async function resolveRootScopeId(transaction) {
  const root = await AmbitoAcademico.findOne({
    where: { tipo: "INSTITUCION" },
    order: [["id_ambito", "ASC"]],
    transaction
  });
  return root?.id_ambito ?? null;
}

async function findOrCreateScope({ tipo, codigo, nombre, padreId = null }, transaction) {
  const existing = await AmbitoAcademico.findOne({ where: { codigo }, transaction });

  if (existing) {
    if (existing.tipo !== tipo) {
      throw new AppError(
        `El código ${codigo} ya está registrado como ámbito de tipo ${existing.tipo}.`,
        422,
        "SCOPE_CODE_CONFLICT"
      );
    }
    return existing;
  }

  return AmbitoAcademico.create(
    { tipo, codigo, nombre, ambito_padre_id: padreId, activo: true },
    { transaction }
  );
}

async function resolveFacultadScope(idMacrounidad, transaction) {
  if (!idMacrounidad) return null;

  const macrounidad = await Macrounidad.findByPk(idMacrounidad, { transaction });
  if (!macrounidad) return null;

  return findOrCreateScope(
    {
      tipo: "FACULTAD",
      codigo: macrounidad.id_macrounidad,
      nombre: macrounidad.nombre,
      padreId: await resolveRootScopeId(transaction)
    },
    transaction
  );
}

/**
 * Resuelve el ámbito académico del usuario nuevo.
 * - `ambitoId`: usa el ámbito existente indicado (comportamiento original).
 * - `car_codigo` (DIRECTOR): resuelve el programa desde la tabla Carrera.
 * - `id_macrounidad` (DECANO): resuelve la facultad desde Macrounidad.
 * Si el ámbito no existe todavía, se crea a partir de la dimensión cargada.
 */
export async function resolveScopeForRole(roleCode, { ambitoId, car_codigo, id_macrounidad }, transaction) {
  if (ambitoId !== undefined && ambitoId !== null) {
    return AmbitoAcademico.findByPk(ambitoId, { transaction });
  }

  const requiredType = expectedScopeType(roleCode);

  if (requiredType === "PROGRAMA") {
    if (!car_codigo) {
      throw new AppError("Debe indicar la carrera del director.", 422, "SCOPE_REQUIRED");
    }

    const carrera = await Carrera.findByPk(car_codigo, { transaction });
    if (!carrera) {
      throw new AppError("La carrera indicada no existe.", 422, "INVALID_CAREER");
    }

    const facultad = await resolveFacultadScope(carrera.id_macrounidad, transaction);

    return findOrCreateScope(
      {
        tipo: "PROGRAMA",
        codigo: carrera.car_codigo,
        nombre: carrera.nombre,
        padreId: facultad?.id_ambito ?? null
      },
      transaction
    );
  }

  if (requiredType === "FACULTAD") {
    if (!id_macrounidad) {
      throw new AppError("Debe indicar la facultad del decano.", 422, "SCOPE_REQUIRED");
    }

    const macrounidad = await Macrounidad.findByPk(id_macrounidad, { transaction });
    if (!macrounidad) {
      throw new AppError("La facultad indicada no existe.", 422, "INVALID_FACULTY");
    }

    return findOrCreateScope(
      {
        tipo: "FACULTAD",
        codigo: macrounidad.id_macrounidad,
        nombre: macrounidad.nombre,
        padreId: await resolveRootScopeId(transaction)
      },
      transaction
    );
  }

  throw new AppError(
    "Debe indicar un ámbito académico para el rol seleccionado.",
    422,
    "SCOPE_REQUIRED"
  );
}
