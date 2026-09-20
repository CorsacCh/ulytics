import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const AmbitoAcademico = sequelize.define(
  "AmbitoAcademico",
  {
    id_ambito: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["INSTITUCION", "FACULTAD", "PROGRAMA"]]
      }
    },
    codigo: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: "ambito_academico",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);
