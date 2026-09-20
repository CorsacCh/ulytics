import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Rol = sequelize.define("Rol", {
  id_rol: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(80),
    unique: true,
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING(40),
    unique: true,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(250)
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: "rol",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});
