import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';

export const Macrounidad = sequelize.define('Macrounidad', {
  id_macrounidad: { type: DataTypes.STRING(20), primaryKey: true },
  nombre: { type: DataTypes.STRING(150) }
}, { tableName: 'Macrounidad', timestamps: false });
