import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { Rol } from "./Rol.js";

export const Usuario = sequelize.define("Usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Usuario',
  timestamps: false
});

// Relación: Un Usuario pertenece a un Rol
Rol.hasMany(Usuario, { foreignKey: 'rol_id' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id' });