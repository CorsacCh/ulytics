'use strict';

const tableExists = async (queryInterface, tableName, transaction) => {
  const tables = await queryInterface.showAllTables({ transaction });
  return tables.some((table) => {
    const name = typeof table === 'string' ? table : table.tableName || table.name;
    return name === tableName;
  });
};

const columnExists = async (queryInterface, tableName, columnName, transaction) => {
  if (!(await tableExists(queryInterface, tableName, transaction))) return false;
  const columns = await queryInterface.describeTable(tableName, { transaction });
  return Object.hasOwn(columns, columnName);
};

const addColumnIfMissing = async (
  queryInterface,
  tableName,
  columnName,
  definition,
  transaction
) => {
  if (!(await columnExists(queryInterface, tableName, columnName, transaction))) {
    await queryInterface.addColumn(tableName, columnName, definition, { transaction });
  }
};

const removeColumnIfPresent = async (
  queryInterface,
  tableName,
  columnName,
  transaction
) => {
  if (await columnExists(queryInterface, tableName, columnName, transaction)) {
    await queryInterface.removeColumn(tableName, columnName, { transaction });
  }
};

const indexFields = (index) =>
  (index.fields || []).map((field) => field.attribute || field.name).join(',');

const ensureIndex = async (
  queryInterface,
  tableName,
  fields,
  options,
  transaction
) => {
  const indexes = await queryInterface.showIndex(tableName, { transaction });
  const expectedFields = fields.join(',');
  const exists = indexes.some(
    (index) =>
      index.name === options.name || indexFields(index) === expectedFields
  );

  if (!exists) {
    await queryInterface.addIndex(tableName, fields, {
      ...options,
      transaction
    });
  }
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Ingreso por cohorte y matrícula anual son hechos con dimensiones
      // temporales distintas. La tabla heredada mezclaba ambos conceptos.
      if (!(await tableExists(queryInterface, 'Fact_Ingreso_Cohorte', transaction))) {
        await queryInterface.createTable(
          'Fact_Ingreso_Cohorte',
          {
            id_ingreso: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false
            },
            car_codigo: {
              type: Sequelize.STRING(20),
              allowNull: false,
              references: { model: 'Carrera', key: 'car_codigo' },
              onUpdate: 'CASCADE',
              onDelete: 'RESTRICT'
            },
            cohorte: { type: Sequelize.SMALLINT, allowNull: false },
            ingresos_sua: { type: Sequelize.INTEGER, allowNull: true },
            ingresos_pace: { type: Sequelize.INTEGER, allowNull: true },
            ingresos_especiales: { type: Sequelize.INTEGER, allowNull: true },
            ingresos_totales: { type: Sequelize.INTEGER, allowNull: true },
            porcentaje_mujeres: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            cobertura_sua: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
            cobertura_pace: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
            cobertura_rae: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
            estados_datos: {
              type: Sequelize.JSONB,
              allowNull: false,
              defaultValue: Sequelize.literal("'{}'::jsonb")
            },
            id_carga: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: 'Carga_Datos', key: 'id_carga' },
              onUpdate: 'CASCADE',
              onDelete: 'SET NULL'
            }
          },
          { transaction }
        );

        await ensureIndex(
          queryInterface,
          'Fact_Ingreso_Cohorte',
          ['car_codigo', 'cohorte'],
          {
            name: 'fact_ingreso_cohorte_carrera_cohorte_uk',
            unique: true
          },
          transaction
        );
      }

      if (!(await tableExists(queryInterface, 'Fact_Matricula_Anual', transaction))) {
        await queryInterface.createTable(
          'Fact_Matricula_Anual',
          {
            id_matricula: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false
            },
            car_codigo: {
              type: Sequelize.STRING(20),
              allowNull: false,
              references: { model: 'Carrera', key: 'car_codigo' },
              onUpdate: 'CASCADE',
              onDelete: 'RESTRICT'
            },
            anio_medicion: { type: Sequelize.SMALLINT, allowNull: false },
            matricula_total: { type: Sequelize.INTEGER, allowNull: true },
            matricula_mujeres: { type: Sequelize.INTEGER, allowNull: true },
            porcentaje_mujeres: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            estados_datos: {
              type: Sequelize.JSONB,
              allowNull: false,
              defaultValue: Sequelize.literal("'{}'::jsonb")
            },
            id_carga: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: 'Carga_Datos', key: 'id_carga' },
              onUpdate: 'CASCADE',
              onDelete: 'SET NULL'
            }
          },
          { transaction }
        );

        await ensureIndex(
          queryInterface,
          'Fact_Matricula_Anual',
          ['car_codigo', 'anio_medicion'],
          {
            name: 'fact_matricula_anual_carrera_anio_uk',
            unique: true
          },
          transaction
        );
      }

      if (await tableExists(queryInterface, 'Fact_Admision_Matricula', transaction)) {
        await queryInterface.sequelize.query(
          `INSERT INTO "Fact_Ingreso_Cohorte"
            ("car_codigo", "cohorte", "ingresos_sua", "ingresos_pace",
             "ingresos_especiales", "ingresos_totales", "estados_datos", "id_carga")
           SELECT "car_codigo", "anio", "ingresos_sua", "ingresos_pace",
                  "ingresos_rae", "ingresos_totales", '{}'::jsonb, "id_carga"
           FROM "Fact_Admision_Matricula"
           ON CONFLICT ("car_codigo", "cohorte") DO NOTHING`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `INSERT INTO "Fact_Matricula_Anual"
            ("car_codigo", "anio_medicion", "matricula_total", "matricula_mujeres",
             "estados_datos", "id_carga")
           SELECT "car_codigo", "anio", "matricula_total", "matricula_mujeres",
                  '{}'::jsonb, "id_carga"
           FROM "Fact_Admision_Matricula"
           ON CONFLICT ("car_codigo", "anio_medicion") DO NOTHING`,
          { transaction }
        );

        await queryInterface.dropTable('Fact_Admision_Matricula', { transaction });
      }

      if (await tableExists(queryInterface, 'Fact_Progresion_Academica', transaction)) {
        if (
          (await columnExists(
            queryInterface,
            'Fact_Progresion_Academica',
            'tasa_titulacion_temprana',
            transaction
          )) &&
          !(await columnExists(
            queryInterface,
            'Fact_Progresion_Academica',
            'tasa_titulacion_total',
            transaction
          ))
        ) {
          await queryInterface.renameColumn(
            'Fact_Progresion_Academica',
            'tasa_titulacion_temprana',
            'tasa_titulacion_total',
            { transaction }
          );
        }

        await addColumnIfMissing(
          queryInterface,
          'Fact_Progresion_Academica',
          'estados_datos',
          {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: Sequelize.literal("'{}'::jsonb")
          },
          transaction
        );
      }

      if (await tableExists(queryInterface, 'Fact_Titulacion_Grados', transaction)) {
        await queryInterface.renameTable(
          'Fact_Titulacion_Grados',
          'Fact_Avance_Curricular',
          { transaction }
        );
      }

      if (await tableExists(queryInterface, 'Fact_Avance_Curricular', transaction)) {
        const renames = [
          ['id_grados', 'id_avance'],
          ['anio', 'cohorte'],
          ['bachilleratos', 'porcentaje_bachillerato'],
          [
            'licenciaturas_asig_pendientes',
            'porcentaje_licenciatura_con_bachillerato_pendiente'
          ],
          ['licenciaturas', 'porcentaje_licenciatura'],
          ['titulados', 'porcentaje_titulo']
        ];

        for (const [oldName, newName] of renames) {
          if (
            (await columnExists(
              queryInterface,
              'Fact_Avance_Curricular',
              oldName,
              transaction
            )) &&
            !(await columnExists(
              queryInterface,
              'Fact_Avance_Curricular',
              newName,
              transaction
            ))
          ) {
            await queryInterface.renameColumn(
              'Fact_Avance_Curricular',
              oldName,
              newName,
              { transaction }
            );
          }
        }

        for (const column of [
          'porcentaje_bachillerato',
          'porcentaje_licenciatura_con_bachillerato_pendiente',
          'porcentaje_licenciatura',
          'porcentaje_titulo'
        ]) {
          await queryInterface.changeColumn(
            'Fact_Avance_Curricular',
            column,
            { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            { transaction }
          );
        }

        await addColumnIfMissing(
          queryInterface,
          'Fact_Avance_Curricular',
          'porcentaje_titulo_con_bachillerato_licenciatura_pendiente',
          { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          transaction
        );
        await addColumnIfMissing(
          queryInterface,
          'Fact_Avance_Curricular',
          'estados_datos',
          {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: Sequelize.literal("'{}'::jsonb")
          },
          transaction
        );
      }

      if (await tableExists(queryInterface, 'Fact_Eficiencia_Curricular', transaction)) {
        if (
          (await columnExists(
            queryInterface,
            'Fact_Eficiencia_Curricular',
            'anio',
            transaction
          )) &&
          !(await columnExists(
            queryInterface,
            'Fact_Eficiencia_Curricular',
            'cohorte',
            transaction
          ))
        ) {
          await queryInterface.renameColumn(
            'Fact_Eficiencia_Curricular',
            'anio',
            'cohorte',
            { transaction }
          );
        }

        await addColumnIfMissing(
          queryInterface,
          'Fact_Eficiencia_Curricular',
          'estados_datos',
          {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: Sequelize.literal("'{}'::jsonb")
          },
          transaction
        );
      }

      if (await tableExists(queryInterface, 'Fact_Asignatura_Critica', transaction)) {
        if (
          (await columnExists(
            queryInterface,
            'Fact_Asignatura_Critica',
            'anio',
            transaction
          )) &&
          !(await columnExists(
            queryInterface,
            'Fact_Asignatura_Critica',
            'anio_medicion',
            transaction
          ))
        ) {
          await queryInterface.renameColumn(
            'Fact_Asignatura_Critica',
            'anio',
            'anio_medicion',
            { transaction }
          );
        }

        await addColumnIfMissing(
          queryInterface,
          'Fact_Asignatura_Critica',
          'asig_codigo_base',
          { type: Sequelize.STRING(50), allowNull: true },
          transaction
        );
        await queryInterface.sequelize.query(
          `UPDATE "Fact_Asignatura_Critica"
           SET "asig_codigo_base" = regexp_replace(
             TRIM("asig_codigo"),
             '-[0-9]{2}$',
             ''
           )
           WHERE "asig_codigo_base" IS NULL`,
          { transaction }
        );
        await queryInterface.changeColumn(
          'Fact_Asignatura_Critica',
          'asig_codigo_base',
          { type: Sequelize.STRING(50), allowNull: false },
          { transaction }
        );
        await addColumnIfMissing(
          queryInterface,
          'Fact_Asignatura_Critica',
          'estado_dato',
          {
            type: Sequelize.STRING(30),
            allowNull: false,
            defaultValue: 'INFORMADO'
          },
          transaction
        );

        await ensureIndex(
          queryInterface,
          'Fact_Asignatura_Critica',
          ['car_codigo', 'asig_codigo_base'],
          {
            name: 'fact_asignatura_critica_codigo_base_idx'
          },
          transaction
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      if (!(await tableExists(queryInterface, 'Fact_Admision_Matricula', transaction))) {
        await queryInterface.createTable(
          'Fact_Admision_Matricula',
          {
            id_admision: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false
            },
            car_codigo: {
              type: Sequelize.STRING(20),
              allowNull: false,
              references: { model: 'Carrera', key: 'car_codigo' }
            },
            anio: { type: Sequelize.SMALLINT, allowNull: false },
            ingresos_sua: { type: Sequelize.INTEGER, allowNull: true },
            ingresos_pace: { type: Sequelize.INTEGER, allowNull: true },
            ingresos_rae: { type: Sequelize.INTEGER, allowNull: true },
            ingresos_totales: { type: Sequelize.INTEGER, allowNull: true },
            matricula_total: { type: Sequelize.INTEGER, allowNull: true },
            matricula_mujeres: { type: Sequelize.INTEGER, allowNull: true },
            id_carga: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: 'Carga_Datos', key: 'id_carga' }
            }
          },
          { transaction }
        );
        await ensureIndex(
          queryInterface,
          'Fact_Admision_Matricula',
          ['car_codigo', 'anio'],
          { unique: true },
          transaction
        );

        if (
          (await tableExists(queryInterface, 'Fact_Ingreso_Cohorte', transaction)) &&
          (await tableExists(queryInterface, 'Fact_Matricula_Anual', transaction))
        ) {
          await queryInterface.sequelize.query(
            `INSERT INTO "Fact_Admision_Matricula"
              ("car_codigo", "anio", "ingresos_sua", "ingresos_pace", "ingresos_rae",
               "ingresos_totales", "matricula_total", "matricula_mujeres", "id_carga")
             SELECT COALESCE(i."car_codigo", m."car_codigo"),
                    COALESCE(i."cohorte", m."anio_medicion"),
                    i."ingresos_sua", i."ingresos_pace", i."ingresos_especiales",
                    i."ingresos_totales", m."matricula_total", m."matricula_mujeres",
                    COALESCE(i."id_carga", m."id_carga")
             FROM "Fact_Ingreso_Cohorte" i
             FULL OUTER JOIN "Fact_Matricula_Anual" m
               ON m."car_codigo" = i."car_codigo"
              AND m."anio_medicion" = i."cohorte"`,
            { transaction }
          );
        }
      }

      if (await tableExists(queryInterface, 'Fact_Matricula_Anual', transaction)) {
        await queryInterface.dropTable('Fact_Matricula_Anual', { transaction });
      }
      if (await tableExists(queryInterface, 'Fact_Ingreso_Cohorte', transaction)) {
        await queryInterface.dropTable('Fact_Ingreso_Cohorte', { transaction });
      }

      if (await tableExists(queryInterface, 'Fact_Progresion_Academica', transaction)) {
        await removeColumnIfPresent(
          queryInterface,
          'Fact_Progresion_Academica',
          'estados_datos',
          transaction
        );
        if (
          (await columnExists(
            queryInterface,
            'Fact_Progresion_Academica',
            'tasa_titulacion_total',
            transaction
          )) &&
          !(await columnExists(
            queryInterface,
            'Fact_Progresion_Academica',
            'tasa_titulacion_temprana',
            transaction
          ))
        ) {
          await queryInterface.renameColumn(
            'Fact_Progresion_Academica',
            'tasa_titulacion_total',
            'tasa_titulacion_temprana',
            { transaction }
          );
        }
      }

      if (await tableExists(queryInterface, 'Fact_Avance_Curricular', transaction)) {
        await removeColumnIfPresent(
          queryInterface,
          'Fact_Avance_Curricular',
          'porcentaje_titulo_con_bachillerato_licenciatura_pendiente',
          transaction
        );
        await removeColumnIfPresent(
          queryInterface,
          'Fact_Avance_Curricular',
          'estados_datos',
          transaction
        );

        for (const column of [
          'porcentaje_bachillerato',
          'porcentaje_licenciatura_con_bachillerato_pendiente',
          'porcentaje_licenciatura',
          'porcentaje_titulo'
        ]) {
          if (
            await columnExists(
              queryInterface,
              'Fact_Avance_Curricular',
              column,
              transaction
            )
          ) {
            await queryInterface.sequelize.query(
              `ALTER TABLE "Fact_Avance_Curricular"
               ALTER COLUMN "${column}" TYPE INTEGER
               USING ROUND("${column}")::integer`,
              { transaction }
            );
          }
        }

        const renames = [
          ['id_avance', 'id_grados'],
          ['cohorte', 'anio'],
          ['porcentaje_bachillerato', 'bachilleratos'],
          [
            'porcentaje_licenciatura_con_bachillerato_pendiente',
            'licenciaturas_asig_pendientes'
          ],
          ['porcentaje_licenciatura', 'licenciaturas'],
          ['porcentaje_titulo', 'titulados']
        ];

        for (const [oldName, newName] of renames) {
          if (
            (await columnExists(
              queryInterface,
              'Fact_Avance_Curricular',
              oldName,
              transaction
            )) &&
            !(await columnExists(
              queryInterface,
              'Fact_Avance_Curricular',
              newName,
              transaction
            ))
          ) {
            await queryInterface.renameColumn(
              'Fact_Avance_Curricular',
              oldName,
              newName,
              { transaction }
            );
          }
        }

        await queryInterface.renameTable(
          'Fact_Avance_Curricular',
          'Fact_Titulacion_Grados',
          { transaction }
        );
      }

      if (await tableExists(queryInterface, 'Fact_Eficiencia_Curricular', transaction)) {
        await removeColumnIfPresent(
          queryInterface,
          'Fact_Eficiencia_Curricular',
          'estados_datos',
          transaction
        );
        if (
          (await columnExists(
            queryInterface,
            'Fact_Eficiencia_Curricular',
            'cohorte',
            transaction
          )) &&
          !(await columnExists(
            queryInterface,
            'Fact_Eficiencia_Curricular',
            'anio',
            transaction
          ))
        ) {
          await queryInterface.renameColumn(
            'Fact_Eficiencia_Curricular',
            'cohorte',
            'anio',
            { transaction }
          );
        }
      }

      if (await tableExists(queryInterface, 'Fact_Asignatura_Critica', transaction)) {
        const indexes = await queryInterface.showIndex('Fact_Asignatura_Critica', {
          transaction
        });
        if (
          indexes.some(
            (index) => index.name === 'fact_asignatura_critica_codigo_base_idx'
          )
        ) {
          await queryInterface.removeIndex(
            'Fact_Asignatura_Critica',
            'fact_asignatura_critica_codigo_base_idx',
            { transaction }
          );
        }
        await removeColumnIfPresent(
          queryInterface,
          'Fact_Asignatura_Critica',
          'asig_codigo_base',
          transaction
        );
        await removeColumnIfPresent(
          queryInterface,
          'Fact_Asignatura_Critica',
          'estado_dato',
          transaction
        );
        if (
          (await columnExists(
            queryInterface,
            'Fact_Asignatura_Critica',
            'anio_medicion',
            transaction
          )) &&
          !(await columnExists(
            queryInterface,
            'Fact_Asignatura_Critica',
            'anio',
            transaction
          ))
        ) {
          await queryInterface.renameColumn(
            'Fact_Asignatura_Critica',
            'anio_medicion',
            'anio',
            { transaction }
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
