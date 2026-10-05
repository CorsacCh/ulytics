import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Carrera } from './Carrera.js';
import { CargaDatos } from './CargaDatos.js';

export const FactMatricula = sequelize.define('Fact_Matricula_Anual', {
  id_matricula: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  car_codigo: { type: DataTypes.STRING(20), allowNull: false },
  anio_medicion: { type: DataTypes.SMALLINT, allowNull: false },
  matricula_total: { type: DataTypes.INTEGER },
  matricula_mujeres: { type: DataTypes.INTEGER },
  porcentaje_mujeres: { type: DataTypes.DECIMAL(5, 2) },
  estados_datos: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  id_carga: { type: DataTypes.INTEGER }
}, {
  tableName: 'Fact_Matricula_Anual',
  timestamps: false,
  indexes: [{ unique: true, fields: ['car_codigo', 'anio_medicion'] }]
});

Carrera.hasMany(FactMatricula, { foreignKey: 'car_codigo' });
FactMatricula.belongsTo(Carrera, { foreignKey: 'car_codigo' });
CargaDatos.hasMany(FactMatricula, { foreignKey: 'id_carga' });
FactMatricula.belongsTo(CargaDatos, { foreignKey: 'id_carga' });
