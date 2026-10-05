import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Carrera } from './Carrera.js';
import { CargaDatos } from './CargaDatos.js';

export const FactIngreso = sequelize.define('Fact_Ingreso_Cohorte', {
  id_ingreso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  car_codigo: { type: DataTypes.STRING(20), allowNull: false },
  cohorte: { type: DataTypes.SMALLINT, allowNull: false },
  ingresos_sua: { type: DataTypes.INTEGER },
  ingresos_pace: { type: DataTypes.INTEGER },
  ingresos_especiales: { type: DataTypes.INTEGER },
  ingresos_totales: { type: DataTypes.INTEGER },
  porcentaje_mujeres: { type: DataTypes.DECIMAL(5, 2) },
  cobertura_sua: { type: DataTypes.DECIMAL(7, 2) },
  cobertura_pace: { type: DataTypes.DECIMAL(7, 2) },
  cobertura_rae: { type: DataTypes.DECIMAL(7, 2) },
  estados_datos: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  id_carga: { type: DataTypes.INTEGER }
}, {
  tableName: 'Fact_Ingreso_Cohorte',
  timestamps: false,
  indexes: [{ unique: true, fields: ['car_codigo', 'cohorte'] }]
});

Carrera.hasMany(FactIngreso, { foreignKey: 'car_codigo' });
FactIngreso.belongsTo(Carrera, { foreignKey: 'car_codigo' });
CargaDatos.hasMany(FactIngreso, { foreignKey: 'id_carga' });
FactIngreso.belongsTo(CargaDatos, { foreignKey: 'id_carga' });
