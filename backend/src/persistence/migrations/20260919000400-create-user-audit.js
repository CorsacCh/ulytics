"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        "auditoria_usuario",
        {
          id_auditoria: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          realizado_por_usuario_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "usuario", key: "id_usuario" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
          },
          usuario_afectado_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "usuario", key: "id_usuario" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
          },
          accion: {
            type: Sequelize.STRING(80),
            allowNull: false
          },
          detalle: {
            type: Sequelize.JSONB,
            allowNull: true
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
          }
        },
        { transaction }
      );

      await queryInterface.addIndex(
        "auditoria_usuario",
        ["realizado_por_usuario_id", "created_at"],
        { name: "auditoria_usuario_actor_fecha_idx", transaction }
      );
      await queryInterface.addIndex(
        "auditoria_usuario",
        ["usuario_afectado_id", "created_at"],
        { name: "auditoria_usuario_objetivo_fecha_idx", transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("auditoria_usuario");
  }
};
