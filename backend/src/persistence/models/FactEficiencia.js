import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Carrera } from './Carrera.js';
import { CargaDatos } from './CargaDatos.js';

export const FactEficiencia = sequelize.define('Fact_Eficiencia_Curricular', {
  id_eficiencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  car_codigo: { type: DataTypes.STRING(20), allowNull: false },
  anio: { type: DataTypes.SMALLINT, allowNull: false },
  nivel_baja: { type: DataTypes.INTEGER },
  nivel_media: { type: DataTypes.INTEGER },
  nivel_alta: { type: DataTypes.INTEGER },
  nivel_eficiente: { type: DataTypes.INTEGER },
  total_alumnos_regulares: { type: DataTypes.INTEGER },
  id_carga: { type: DataTypes.INTEGER }
}, {
  tableName: 'Fact_Eficiencia_Curricular',
  timestamps: false,
  indexes: [{ unique: true, fields: ['car_codigo', 'anio'] }]
});

Carrera.hasMany(FactEficiencia, { foreignKey: 'car_codigo' });
FactEficiencia.belongsTo(Carrera, { foreignKey: 'car_codigo' });
CargaDatos.hasMany(FactEficiencia, { foreignKey: 'id_carga' });
FactEficiencia.belongsTo(CargaDatos, { foreignKey: 'id_carga' });
