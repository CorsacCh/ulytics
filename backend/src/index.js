import dotenv from 'dotenv';
dotenv.config();

import app from "./app.js";
import { sequelize } from "./persistence/database/database.js";

// 1. IMPORTANTE: Importar los modelos AQUÍ para que Sequelize los registre
import './persistence/models/Rol.js';
import './persistence/models/Usuario.js';
// (Añade aquí los demás modelos a medida que los crees: Carga_Datos, Carrera, etc.)

async function main() {
  try {
    // 2. Verificar que la conexión con el contenedor PostgreSQL sea exitosa
    await sequelize.authenticate();
    console.log('Conexión a PostgreSQL establecida con éxito.');

    // 3. Sincronizar los modelos (alter: true ajusta las tablas sin borrar datos)
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados correctamente.');

    const port = process.env.PORT || 4009;

    // Escuchar siempre en todas las interfaces (accesible desde fuera del contenedor)
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${port}`);
    });

  } catch (error) {
    // 4. Capturar e imprimir cualquier error de conexión
    console.error('Error crítico al iniciar el servidor o conectar a la base de datos:', error);
  }
}

main();