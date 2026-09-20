"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();

    const roles = [
      {
        codigo: "ADMIN",
        nombre: "Administrador",
        descripcion: "Administra usuarios, permisos y configuración de la plataforma."
      },
      {
        codigo: "DIRECTOR",
        nombre: "Director de carrera",
        descripcion: "Consulta la información de una carrera o programa."
      },
      {
        codigo: "DECANO",
        nombre: "Decano",
        descripcion: "Consulta la información de una Facultad."
      },
      {
        codigo: "AUTORIDAD_CENTRAL",
        nombre: "Autoridad Central",
        descripcion: "Consulta información institucional autorizada."
      }
    ];

    const permissions = [
      ["USUARIOS_VER", "Ver usuarios"],
      ["USUARIOS_CREAR", "Crear usuarios"],
      ["USUARIOS_EDITAR", "Editar usuarios"],
      ["USUARIOS_CAMBIAR_ESTADO", "Habilitar o deshabilitar usuarios"],
      ["DASHBOARD_ADMIN_VER", "Ver dashboard de administración"],
      ["DASHBOARD_DIRECTOR_VER", "Ver dashboard de dirección de carrera"],
      ["DASHBOARD_DECANO_VER", "Ver dashboard de decanatura"],
      ["DASHBOARD_AUTORIDAD_VER", "Ver dashboard de Autoridad Central"]
    ].map(([codigo, nombre]) => ({ codigo, nombre }));

    try {
      await queryInterface.bulkInsert(
        "rol",
        roles.map((role) => ({
          ...role,
          activo: true,
          created_at: now,
          updated_at: now
        })),
        { transaction }
      );

      await queryInterface.bulkInsert(
        "permiso",
        permissions.map((permission) => ({
          ...permission,
          activo: true,
          created_at: now,
          updated_at: now
        })),
        { transaction }
      );

      await queryInterface.bulkInsert(
        "ambito_academico",
        [
          {
            tipo: "INSTITUCION",
            codigo: "UACh",
            nombre: "Universidad Austral de Chile",
            ambito_padre_id: null,
            activo: true,
            created_at: now,
            updated_at: now
          }
        ],
        { transaction }
      );

      const roleRows = await queryInterface.sequelize.query(
        "SELECT id_rol, codigo FROM rol WHERE codigo IN (:codes)",
        {
          replacements: { codes: roles.map((role) => role.codigo) },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const permissionRows = await queryInterface.sequelize.query(
        "SELECT id_permiso, codigo FROM permiso WHERE codigo IN (:codes)",
        {
          replacements: {
            codes: permissions.map((permission) => permission.codigo)
          },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      const roleIds = Object.fromEntries(
        roleRows.map((role) => [role.codigo, role.id_rol])
      );
      const permissionIds = Object.fromEntries(
        permissionRows.map((permission) => [
          permission.codigo,
          permission.id_permiso
        ])
      );

      const assignments = {
        ADMIN: [
          "USUARIOS_VER",
          "USUARIOS_CREAR",
          "USUARIOS_EDITAR",
          "USUARIOS_CAMBIAR_ESTADO",
          "DASHBOARD_ADMIN_VER"
        ],
        DIRECTOR: ["DASHBOARD_DIRECTOR_VER"],
        DECANO: ["DASHBOARD_DECANO_VER"],
        AUTORIDAD_CENTRAL: ["DASHBOARD_AUTORIDAD_VER"]
      };

      const rolePermissions = Object.entries(assignments).flatMap(
        ([roleCode, permissionCodes]) =>
          permissionCodes.map((permissionCode) => ({
            rol_id: roleIds[roleCode],
            permiso_id: permissionIds[permissionCode],
            created_at: now
          }))
      );

      await queryInterface.bulkInsert("rol_permiso", rolePermissions, {
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const roleCodes = ["ADMIN", "DIRECTOR", "DECANO", "AUTORIDAD_CENTRAL"];
    const permissionCodes = [
      "USUARIOS_VER",
      "USUARIOS_CREAR",
      "USUARIOS_EDITAR",
      "USUARIOS_CAMBIAR_ESTADO",
      "DASHBOARD_ADMIN_VER",
      "DASHBOARD_DIRECTOR_VER",
      "DASHBOARD_DECANO_VER",
      "DASHBOARD_AUTORIDAD_VER"
    ];

    try {
      const roleRows = await queryInterface.sequelize.query(
        "SELECT id_rol FROM rol WHERE codigo IN (:codes)",
        {
          replacements: { codes: roleCodes },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const permissionRows = await queryInterface.sequelize.query(
        "SELECT id_permiso FROM permiso WHERE codigo IN (:codes)",
        {
          replacements: { codes: permissionCodes },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      await queryInterface.bulkDelete(
        "rol_permiso",
        {
          rol_id: roleRows.map((role) => role.id_rol),
          permiso_id: permissionRows.map((permission) => permission.id_permiso)
        },
        { transaction }
      );
      await queryInterface.bulkDelete(
        "ambito_academico",
        { codigo: "UACh" },
        { transaction }
      );
      await queryInterface.bulkDelete(
        "permiso",
        { codigo: permissionCodes },
        { transaction }
      );
      await queryInterface.bulkDelete(
        "rol",
        { codigo: roleCodes },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
