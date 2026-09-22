import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Carrera } from './Carrera.js';
import { CargaDatos } from './CargaDatos.js';

export const FactProgresion = sequelize.define('Fact_Progresion_Academica', {
  id_progresion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  car_codigo: { type: DataTypes.STRING(20), allowNull: false },
  cohorte: { type: DataTypes.SMALLINT, allowNull: false },
  retencion_a1: { type: DataTypes.DECIMAL(5, 2) },
  retencion_a2: { type: DataTypes.DECIMAL(5, 2) },
  retencion_a3: { type: DataTypes.DECIMAL(5, 2) },
  retencion_a4: { type: DataTypes.DECIMAL(5, 2) },
  retencion_total: { type: DataTypes.DECIMAL(5, 2) },
  tasa_titulacion_temprana: { type: DataTypes.DECIMAL(5, 2) },
  tasa_titulacion_oportuna: { type: DataTypes.DECIMAL(5, 2) },
  tasa_titulacion_efectiva: { type: DataTypes.DECIMAL(5, 2) },
  duracion_real_semestres: { type: DataTypes.DECIMAL(5, 2) },
  id_carga: { type: DataTypes.INTEGER }
}, {
  tableName: 'Fact_Progresion_Academica',
  timestamps: false,
  indexes: [{ unique: true, fields: ['car_codigo', 'cohorte'] }]
});

Carrera.hasMany(FactProgresion, { foreignKey: 'car_codigo' });
FactProgresion.belongsTo(Carrera, { foreignKey: 'car_codigo' });
CargaDatos.hasMany(FactProgresion, { foreignKey: 'id_carga' });
FactProgresion.belongsTo(CargaDatos, { foreignKey: 'id_carga' });
