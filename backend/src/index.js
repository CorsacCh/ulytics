import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import { sequelize } from "./persistence/database/database.js";

import "./persistence/models/index.js";

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Conexión a PostgreSQL establecida con éxito.");

    const port = process.env.PORT || 4004;

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error(
      "Error crítico al iniciar el servidor o conectar a la base de datos:",
      error
    );
    process.exitCode = 1;
  }
}

main();
