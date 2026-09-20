import { Rol } from "./Rol.js";
import { Permiso } from "./Permiso.js";
import { AmbitoAcademico } from "./AmbitoAcademico.js";
import { Usuario } from "./Usuario.js";
import { AuditoriaUsuario } from "./AuditoriaUsuario.js";
import { Macrounidad } from "./Macrounidad.js";
import { Carrera } from "./Carrera.js";
import { CargaDatos } from "./CargaDatos.js";
import { FactAdmision } from "./FactAdmision.js";

Rol.belongsToMany(Permiso, {
  through: { model: "rol_permiso", timestamps: false },
  foreignKey: "rol_id",
  otherKey: "permiso_id",
  as: "permisos"
});
Permiso.belongsToMany(Rol, {
  through: { model: "rol_permiso", timestamps: false },
  foreignKey: "permiso_id",
  otherKey: "rol_id",
  as: "roles"
});

Rol.hasMany(Usuario, { foreignKey: "rol_id", as: "usuarios" });
Usuario.belongsTo(Rol, { foreignKey: "rol_id", as: "rol" });

AmbitoAcademico.hasMany(Usuario, {
  foreignKey: "ambito_id",
  as: "usuarios"
});
Usuario.belongsTo(AmbitoAcademico, {
  foreignKey: "ambito_id",
  as: "ambito"
});

AmbitoAcademico.belongsTo(AmbitoAcademico, {
  foreignKey: "ambito_padre_id",
  as: "ambito_padre"
});
AmbitoAcademico.hasMany(AmbitoAcademico, {
  foreignKey: "ambito_padre_id",
  as: "ambitos_hijos"
});

Usuario.hasMany(AuditoriaUsuario, {
  foreignKey: "realizado_por_usuario_id",
  as: "acciones_realizadas"
});
AuditoriaUsuario.belongsTo(Usuario, {
  foreignKey: "realizado_por_usuario_id",
  as: "realizado_por"
});

Usuario.hasMany(AuditoriaUsuario, {
  foreignKey: "usuario_afectado_id",
  as: "acciones_recibidas"
});
AuditoriaUsuario.belongsTo(Usuario, {
  foreignKey: "usuario_afectado_id",
  as: "usuario_afectado"
});

export { Rol, Permiso, AmbitoAcademico, Usuario, AuditoriaUsuario, Macrounidad, Carrera, CargaDatos, FactAdmision };
