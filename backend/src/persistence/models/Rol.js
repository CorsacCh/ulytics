import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Rol = sequelize.define("Rol", {
  id_rol: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(200)
  }
}, {
  tableName: 'Rol',
  timestamps: false
});