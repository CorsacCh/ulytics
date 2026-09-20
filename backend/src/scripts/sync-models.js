import { sequelize } from '../persistence/database/database.js';
// Importamos el index que contiene todos los modelos registrados
import '../persistence/models/index.js'; 

async function syncDB() {
  try {
    console.log('Sincronizando modelos con la base de datos...');
    // alter: true revisa qué tablas faltan y las crea sin borrar los datos existentes (como tu usuario admin)
    await sequelize.sync(); 
    console.log('✅ Tablas creadas y sincronizadas correctamente en PostgreSQL');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sincronizando la base de datos:', error);
    process.exit(1);
  }
}

syncDB();
