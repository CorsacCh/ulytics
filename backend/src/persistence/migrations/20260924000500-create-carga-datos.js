'use strict';

// Algunas bases de desarrollo se crearon antes de que existieran las migraciones
// académicas (la versión anterior del backend usaba sequelize.sync). Estas tablas
// ya están presentes en ese caso, por lo que la migración debe poder ejecutarse
// sobre una base con estado parcial sin fallar ni perder datos.
const tableExists = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const name = typeof table === 'string' ? table : table.tableName || table.name;
    return name === tableName;
  });
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    if (await tableExists(queryInterface, 'Carga_Datos')) return;

    await queryInterface.createTable('Carga_Datos', {
      id_carga: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      id_admin: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      fecha_carga: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      nombre_archivo: {
        type: Sequelize.STRING(255)
      },
      estado: {
        type: Sequelize.STRING(20)
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Carga_Datos');
  }
};