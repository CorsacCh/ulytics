"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        "ambito_academico",
        {
          id_ambito: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          tipo: {
            type: Sequelize.STRING(20),
            allowNull: false
          },
          codigo: {
            type: Sequelize.STRING(60),
            allowNull: false,
            unique: true
          },
          nombre: {
            type: Sequelize.STRING(160),
            allowNull: false
          },
          ambito_padre_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "ambito_academico", key: "id_ambito" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT"
          },
          activo: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
          }
        },
        { transaction }
      );

      await queryInterface.addConstraint("ambito_academico", {
        fields: ["tipo"],
        type: "check",
        name: "ambito_academico_tipo_check",
        where: {
          tipo: ["INSTITUCION", "FACULTAD", "PROGRAMA"]
        },
        transaction
      });

      await queryInterface.addIndex("ambito_academico", ["ambito_padre_id"], {
        name: "ambito_academico_padre_idx",
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ambito_academico");
  }
};
