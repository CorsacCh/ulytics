import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';

// Registro de cada reporte descargado desde los dashboards académicos.
// url_archivo conserva la ruta real del archivo para poder volver a
// descargarlo desde la sección "Historial de descargas".
export const HistorialDescarga = sequelize.define('Historial_Descarga', {
  id_descarga: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_archivo: { type: DataTypes.STRING(255), allowNull: false },
  formato: { type: DataTypes.STRING(20), allowNull: false },
  periodo: { type: DataTypes.STRING(50), allowNull: false },
  fecha_descarga: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  tamano_kb: { type: DataTypes.INTEGER, allowNull: false },
  url_archivo: { type: DataTypes.STRING(500), allowNull: false }
}, {
  tableName: 'Historial_Descarga',
  timestamps: false,
  indexes: [{ fields: ['fecha_descarga'] }]
});
