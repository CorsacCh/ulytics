import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Carrera } from './Carrera.js';
import { CargaDatos } from './CargaDatos.js';

export const FactAvanceCurricular = sequelize.define('Fact_Avance_Curricular', {
  id_avance: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  car_codigo: { type: DataTypes.STRING(20), allowNull: false },
  cohorte: { type: DataTypes.SMALLINT, allowNull: false },
  porcentaje_bachillerato: { type: DataTypes.DECIMAL(5, 2) },
  porcentaje_licenciatura_con_bachillerato_pendiente: {
    type: DataTypes.DECIMAL(5, 2)
  },
  porcentaje_licenciatura: { type: DataTypes.DECIMAL(5, 2) },
  porcentaje_titulo_con_bachillerato_licenciatura_pendiente: {
    type: DataTypes.DECIMAL(5, 2)
  },
  porcentaje_titulo: { type: DataTypes.DECIMAL(5, 2) },
  estados_datos: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  id_carga: { type: DataTypes.INTEGER }
}, {
  tableName: 'Fact_Avance_Curricular',
  timestamps: false,
  indexes: [{ unique: true, fields: ['car_codigo', 'cohorte'] }]
});

Carrera.hasMany(FactAvanceCurricular, { foreignKey: 'car_codigo' });
FactAvanceCurricular.belongsTo(Carrera, { foreignKey: 'car_codigo' });
CargaDatos.hasMany(FactAvanceCurricular, { foreignKey: 'id_carga' });
FactAvanceCurricular.belongsTo(CargaDatos, { foreignKey: 'id_carga' });
