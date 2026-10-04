'use strict';

// Igual que el resto de migraciones académicas, puede ejecutarse sobre bases
// creadas antes con sequelize.sync: si la tabla ya existe no hace nada.
const tableExists = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const name = typeof table === 'string' ? table : table.tableName || table.name;
    return name === tableName;
  });
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, 'Historial_Descarga')) return;

    await queryInterface.createTable('Historial_Descarga', {
      id_descarga: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre_archivo: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      formato: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      periodo: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      fecha_descarga: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      tamano_kb: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      url_archivo: {
        type: Sequelize.STRING(500),
        allowNull: false
      }
    });

    // El historial se consulta siempre ordenado por fecha.
    await queryInterface.addIndex('Historial_Descarga', ['fecha_descarga']);
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface, 'Historial_Descarga')) {
      await queryInterface.dropTable('Historial_Descarga');
    }
  }
};
