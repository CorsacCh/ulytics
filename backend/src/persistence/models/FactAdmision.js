import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Carrera } from './Carrera.js';
import { CargaDatos } from './CargaDatos.js';

export const FactAdmision = sequelize.define('Fact_Admision_Matricula', {
  id_admision: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  car_codigo: { type: DataTypes.STRING(20), allowNull: false },
  anio: { type: DataTypes.SMALLINT, allowNull: false },
  ingresos_sua: { type: DataTypes.INTEGER },
  ingresos_pace: { type: DataTypes.INTEGER },
  ingresos_rae: { type: DataTypes.INTEGER },
  ingresos_totales: { type: DataTypes.INTEGER },
  matricula_total: { type: DataTypes.INTEGER },
  matricula_mujeres: { type: DataTypes.INTEGER },
  id_carga: { type: DataTypes.INTEGER }
}, { 
  tableName: 'Fact_Admision_Matricula', 
  timestamps: false,
  indexes: [{ unique: true, fields: ['car_codigo', 'anio'] }]
});

Carrera.hasMany(FactAdmision, { foreignKey: 'car_codigo' });
FactAdmision.belongsTo(Carrera, { foreignKey: 'car_codigo' });
CargaDatos.hasMany(FactAdmision, { foreignKey: 'id_carga' });
FactAdmision.belongsTo(CargaDatos, { foreignKey: 'id_carga' });
