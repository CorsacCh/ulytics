import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const { sequelize } = await import("../persistence/database/database.js");
const {
  AmbitoAcademico,
  AuditoriaUsuario,
  Rol,
  Usuario
} = await import("../persistence/models/index.js");
const {
  assertPasswordPolicy,
  isInstitutionalEmail,
  normalizeEmail
} = await import("../utils/credentials.js");

async function createInitialAdmin() {
  const nombre = process.env.INITIAL_ADMIN_NAME?.trim();
  const email = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL || "");
  const password = process.env.INITIAL_ADMIN_PASSWORD || "";

  if (!nombre || !email || !password) {
    throw new Error(
      "Complete INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD en backend/.env."
    );
  }
  if (!isInstitutionalEmail(email)) {
    throw new Error("INITIAL_ADMIN_EMAIL debe pertenecer al dominio institucional.");
  }
  assertPasswordPolicy(password);

  const existingUser = await Usuario.findOne({ where: { email } });
  if (existingUser) {
    console.log("El administrador inicial ya existe. No se realizaron cambios.");
    return;
  }

  const role = await Rol.findOne({ where: { codigo: "ADMIN", activo: true } });
  const scope = await AmbitoAcademico.findOne({
    where: { tipo: "INSTITUCION", activo: true }
  });

  if (!role || !scope) {
    throw new Error("Ejecute las migraciones y seeders antes de crear el administrador.");
  }

  const anotherAdmin = await Usuario.findOne({ where: { rol_id: role.id_rol } });
  if (anotherAdmin) {
    console.log("Ya existe una cuenta administradora. No se realizaron cambios.");
    return;
  }

  await sequelize.transaction(async (transaction) => {
    const user = await Usuario.create(
      {
        nombre,
        email,
        password_hash: await bcrypt.hash(password, 12),
        rol_id: role.id_rol,
        ambito_id: scope.id_ambito,
        activo: true,
        debe_cambiar_password: true
      },
      { transaction }
    );

    await AuditoriaUsuario.create(
      {
        realizado_por_usuario_id: null,
        usuario_afectado_id: user.id_usuario,
        accion: "INITIAL_ADMIN_CREATED"
      },
      { transaction }
    );
  });

  console.log("Administrador inicial creado correctamente.");
}

try {
  await sequelize.authenticate();
  await createInitialAdmin();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
