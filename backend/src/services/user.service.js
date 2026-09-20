import { Op, fn, col, where } from "sequelize";
import {
  AmbitoAcademico,
  Permiso,
  Rol,
  Usuario
} from "../persistence/models/index.js";

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
