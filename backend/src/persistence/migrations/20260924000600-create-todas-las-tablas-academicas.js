'use strict';

// La versión anterior del backend creaba parte de estas tablas al arrancar
// (sequelize.sync), por lo que existen bases de desarrollo con estado parcial.
// La migración solo crea lo que falta y garantiza los índices únicos, de modo
// que puede ejecutarse tanto en una base nueva como en una con tablas previas.
const tableExists = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const name = typeof table === 'string' ? table : table.tableName || table.name;
    return name === tableName;
  });
};

const indexFields = (index) =>
  (index.fields || []).map((field) => field.attribute || field.name).join(',');

const ensureUniqueIndex = async (queryInterface, tableName, fields) => {
  const indexes = await queryInterface.showIndex(tableName);
  if (indexes.some((index) => indexFields(index) === fields.join(','))) return;
  await queryInterface.addIndex(tableName, fields, { unique: true });
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear Macrounidad
    if (!(await tableExists(queryInterface, 'Macrounidad'))) {
      await queryInterface.createTable('Macrounidad', {
        id_macrounidad: { type: Sequelize.STRING(20), primaryKey: true },
        nombre: { type: Sequelize.STRING(150) }
      });
    }

    // 2. Crear Carrera
    if (!(await tableExists(queryInterface, 'Carrera'))) {
      await queryInterface.createTable('Carrera', {
        car_codigo: { type: Sequelize.STRING(20), primaryKey: true },
        nombre: { type: Sequelize.STRING(150), allowNull: false },
        sede: { type: Sequelize.STRING(50) },
        id_macrounidad: {
          type: Sequelize.STRING(20),
          allowNull: false,
          references: { model: 'Macrounidad', key: 'id_macrounidad' }
        }
      });
    }

    // 3. Crear Fact_Admision_Matricula
    if (!(await tableExists(queryInterface, 'Fact_Admision_Matricula'))) {
      await queryInterface.createTable('Fact_Admision_Matricula', {
        id_admision: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        car_codigo: { type: Sequelize.STRING(20), allowNull: false, references: { model: 'Carrera', key: 'car_codigo' } },
        anio: { type: Sequelize.SMALLINT, allowNull: false },
        ingresos_sua: { type: Sequelize.INTEGER },
        ingresos_pace: { type: Sequelize.INTEGER },
        ingresos_rae: { type: Sequelize.INTEGER },
        ingresos_totales: { type: Sequelize.INTEGER },
        matricula_total: { type: Sequelize.INTEGER },
        matricula_mujeres: { type: Sequelize.INTEGER },
        id_carga: { type: Sequelize.INTEGER, references: { model: 'Carga_Datos', key: 'id_carga' } }
      });
    }
    await ensureUniqueIndex(queryInterface, 'Fact_Admision_Matricula', ['car_codigo', 'anio']);

    // 4. Crear Fact_Asignatura_Critica
    if (!(await tableExists(queryInterface, 'Fact_Asignatura_Critica'))) {
      await queryInterface.createTable('Fact_Asignatura_Critica', {
        id_asignatura_critica: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        car_codigo: { type: Sequelize.STRING(20), allowNull: false, references: { model: 'Carrera', key: 'car_codigo' } },
        asig_codigo: { type: Sequelize.STRING(50), allowNull: false },
        semestre: { type: Sequelize.SMALLINT },
        anio: { type: Sequelize.SMALLINT, allowNull: false },
        tasa_reprobacion: { type: Sequelize.DECIMAL(5, 2) },
        id_carga: { type: Sequelize.INTEGER, references: { model: 'Carga_Datos', key: 'id_carga' } }
      });
    }
    await ensureUniqueIndex(queryInterface, 'Fact_Asignatura_Critica', ['car_codigo', 'asig_codigo', 'anio', 'semestre']);

    // 5. Crear Fact_Eficiencia_Curricular
    if (!(await tableExists(queryInterface, 'Fact_Eficiencia_Curricular'))) {
      await queryInterface.createTable('Fact_Eficiencia_Curricular', {
        id_eficiencia: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        car_codigo: { type: Sequelize.STRING(20), allowNull: false, references: { model: 'Carrera', key: 'car_codigo' } },
        anio: { type: Sequelize.SMALLINT, allowNull: false },
        nivel_baja: { type: Sequelize.INTEGER },
        nivel_media: { type: Sequelize.INTEGER },
        nivel_alta: { type: Sequelize.INTEGER },
        nivel_eficiente: { type: Sequelize.INTEGER },
        total_alumnos_regulares: { type: Sequelize.INTEGER },
        id_carga: { type: Sequelize.INTEGER, references: { model: 'Carga_Datos', key: 'id_carga' } }
      });
    }
    await ensureUniqueIndex(queryInterface, 'Fact_Eficiencia_Curricular', ['car_codigo', 'anio']);

    // 6. Crear Fact_Progresion_Academica
    if (!(await tableExists(queryInterface, 'Fact_Progresion_Academica'))) {
      await queryInterface.createTable('Fact_Progresion_Academica', {
        id_progresion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        car_codigo: { type: Sequelize.STRING(20), allowNull: false, references: { model: 'Carrera', key: 'car_codigo' } },
        cohorte: { type: Sequelize.SMALLINT, allowNull: false },
        retencion_a1: { type: Sequelize.DECIMAL(5, 2) },
        retencion_a2: { type: Sequelize.DECIMAL(5, 2) },
        retencion_a3: { type: Sequelize.DECIMAL(5, 2) },
        retencion_a4: { type: Sequelize.DECIMAL(5, 2) },
        retencion_total: { type: Sequelize.DECIMAL(5, 2) },
        tasa_titulacion_temprana: { type: Sequelize.DECIMAL(5, 2) },
        tasa_titulacion_oportuna: { type: Sequelize.DECIMAL(5, 2) },
        tasa_titulacion_efectiva: { type: Sequelize.DECIMAL(5, 2) },
        duracion_real_semestres: { type: Sequelize.DECIMAL(5, 2) },
        id_carga: { type: Sequelize.INTEGER, references: { model: 'Carga_Datos', key: 'id_carga' } }
      });
    }
    await ensureUniqueIndex(queryInterface, 'Fact_Progresion_Academica', ['car_codigo', 'cohorte']);

    // 7. Crear Fact_Titulacion_Grados
    if (!(await tableExists(queryInterface, 'Fact_Titulacion_Grados'))) {
      await queryInterface.createTable('Fact_Titulacion_Grados', {
        id_grados: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        car_codigo: { type: Sequelize.STRING(20), allowNull: false, references: { model: 'Carrera', key: 'car_codigo' } },
        anio: { type: Sequelize.SMALLINT, allowNull: false },
        titulados: { type: Sequelize.INTEGER },
        licenciaturas: { type: Sequelize.INTEGER },
        bachilleratos: { type: Sequelize.INTEGER },
        licenciaturas_asig_pendientes: { type: Sequelize.INTEGER },
        id_carga: { type: Sequelize.INTEGER, references: { model: 'Carga_Datos', key: 'id_carga' } }
      });
    }
    await ensureUniqueIndex(queryInterface, 'Fact_Titulacion_Grados', ['car_codigo', 'anio']);
  },

  async down(queryInterface, Sequelize) {
    const tablas = [
      'Fact_Titulacion_Grados',
      'Fact_Progresion_Academica',
      'Fact_Eficiencia_Curricular',
      'Fact_Asignatura_Critica',
      'Fact_Admision_Matricula',
      'Carrera',
      'Macrounidad'
    ];

    for (const tabla of tablas) {
      if (await tableExists(queryInterface, tabla)) {
        await queryInterface.dropTable(tabla);
      }
    }
  }
};
