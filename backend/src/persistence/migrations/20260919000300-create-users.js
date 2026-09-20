"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        "usuario",
        {
          id_usuario: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          nombre: {
            type: Sequelize.STRING(120),
            allowNull: false
          },
          email: {
            type: Sequelize.STRING(180),
            allowNull: false
          },
          password_hash: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          rol_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "rol", key: "id_rol" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT"
          },
          ambito_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "ambito_academico", key: "id_ambito" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT"
          },
          activo: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          debe_cambiar_password: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          ultimo_acceso: {
            type: Sequelize.DATE,
            allowNull: true
          },
          password_actualizado_at: {
            type: Sequelize.DATE,
            allowNull: true
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

      await queryInterface.sequelize.query(
        "CREATE UNIQUE INDEX usuario_email_lower_uq ON usuario (LOWER(email));",
        { transaction }
      );

      await queryInterface.addIndex("usuario", ["rol_id"], {
        name: "usuario_rol_idx",
        transaction
      });
      await queryInterface.addIndex("usuario", ["ambito_id"], {
        name: "usuario_ambito_idx",
        transaction
      });
      await queryInterface.addIndex("usuario", ["activo"], {
        name: "usuario_activo_idx",
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("usuario");
  }
};
