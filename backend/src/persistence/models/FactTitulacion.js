import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { Carrera } from './Carrera.js';
import { CargaDatos } from './CargaDatos.js';

export const FactTitulacion = sequelize.define('Fact_Titulacion_Grados', {
  id_grados: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  car_codigo: { type: DataTypes.STRING(20), allowNull: false },
  anio: { type: DataTypes.SMALLINT, allowNull: false },
  titulados: { type: DataTypes.INTEGER },
  licenciaturas: { type: DataTypes.INTEGER },
  bachilleratos: { type: DataTypes.INTEGER },
  licenciaturas_asig_pendientes: { type: DataTypes.INTEGER },
  id_carga: { type: DataTypes.INTEGER }
}, {
  tableName: 'Fact_Titulacion_Grados',
  timestamps: false,
  indexes: [{ unique: true, fields: ['car_codigo', 'anio'] }]
});

Carrera.hasMany(FactTitulacion, { foreignKey: 'car_codigo' });
FactTitulacion.belongsTo(Carrera, { foreignKey: 'car_codigo' });
CargaDatos.hasMany(FactTitulacion, { foreignKey: 'id_carga' });
FactTitulacion.belongsTo(CargaDatos, { foreignKey: 'id_carga' });
