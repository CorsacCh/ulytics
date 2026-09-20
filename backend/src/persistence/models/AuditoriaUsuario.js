import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const AuditoriaUsuario = sequelize.define(
  "AuditoriaUsuario",
  {
    id_auditoria: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    accion: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    detalle: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    tableName: "auditoria_usuario",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);
