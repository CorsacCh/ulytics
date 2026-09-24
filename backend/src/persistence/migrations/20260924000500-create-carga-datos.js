'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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