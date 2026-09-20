import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Usuario } from './Usuario.js';

export const CargaDatos = sequelize.define('Carga_Datos', {
  id_carga: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_admin: { type: DataTypes.INTEGER, allowNull: false },
  fecha_carga: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  nombre_archivo: { type: DataTypes.STRING(255) },
  estado: { type: DataTypes.STRING(20) }
}, { tableName: 'Carga_Datos', timestamps: false });

Usuario.hasMany(CargaDatos, { foreignKey: 'id_admin' });
CargaDatos.belongsTo(Usuario, { foreignKey: 'id_admin' });
