import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Macrounidad } from './Macrounidad.js';

export const Carrera = sequelize.define('Carrera', {
  car_codigo: { type: DataTypes.STRING(20), primaryKey: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  sede: { type: DataTypes.STRING(50) },
  id_macrounidad: { type: DataTypes.STRING(20), allowNull: false }
}, { tableName: 'Carrera', timestamps: false });

Macrounidad.hasMany(Carrera, { foreignKey: 'id_macrounidad' });
Carrera.belongsTo(Macrounidad, { foreignKey: 'id_macrounidad' });
