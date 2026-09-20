"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        "rol",
        {
          id_rol: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          codigo: {
            type: Sequelize.STRING(40),
            allowNull: false,
            unique: true
          },
          nombre: {
            type: Sequelize.STRING(80),
            allowNull: false,
            unique: true
          },
          descripcion: {
            type: Sequelize.STRING(250),
            allowNull: true
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

      await queryInterface.createTable(
        "permiso",
        {
          id_permiso: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          codigo: {
            type: Sequelize.STRING(80),
            allowNull: false,
            unique: true
          },
          nombre: {
            type: Sequelize.STRING(120),
            allowNull: false
          },
          descripcion: {
            type: Sequelize.STRING(250),
            allowNull: true
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

      await queryInterface.createTable(
        "rol_permiso",
        {
          rol_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "rol", key: "id_rol" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          permiso_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "permiso", key: "id_permiso" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
          }
        },
        { transaction }
      );

      await queryInterface.addConstraint("rol_permiso", {
        fields: ["rol_id", "permiso_id"],
        type: "primary key",
        name: "rol_permiso_pk",
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable("rol_permiso", { transaction });
      await queryInterface.dropTable("permiso", { transaction });
      await queryInterface.dropTable("rol", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
