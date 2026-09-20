import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Permiso = sequelize.define(
  "Permiso",
  {
    id_permiso: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: "permiso",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
