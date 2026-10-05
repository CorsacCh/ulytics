import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Carrera } from './Carrera.js';
import { CargaDatos } from './CargaDatos.js';

export const FactAsignaturaCritica = sequelize.define('Fact_Asignatura_Critica', {
  id_asignatura_critica: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  car_codigo: { type: DataTypes.STRING(20), allowNull: false },
  asig_codigo: { type: DataTypes.STRING(50), allowNull: false },
  asig_codigo_base: { type: DataTypes.STRING(50), allowNull: false },
  semestre: { type: DataTypes.SMALLINT },
  anio_medicion: { type: DataTypes.SMALLINT, allowNull: false },
  tasa_reprobacion: { type: DataTypes.DECIMAL(5, 2) },
  estado_dato: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'INFORMADO'
  },
  id_carga: { type: DataTypes.INTEGER }
}, {
  tableName: 'Fact_Asignatura_Critica',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['car_codigo', 'asig_codigo', 'anio_medicion', 'semestre'] },
    { fields: ['car_codigo', 'asig_codigo_base'] }
  ]
});

Carrera.hasMany(FactAsignaturaCritica, { foreignKey: 'car_codigo' });
FactAsignaturaCritica.belongsTo(Carrera, { foreignKey: 'car_codigo' });
CargaDatos.hasMany(FactAsignaturaCritica, { foreignKey: 'id_carga' });
FactAsignaturaCritica.belongsTo(CargaDatos, { foreignKey: 'id_carga' });
