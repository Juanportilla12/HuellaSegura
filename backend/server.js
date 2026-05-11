require('dotenv').config();
const app        = require('./src/app');
const sequelize  = require('./src/config/connection');
const { seedAdmin } = require('./src/seeders/adminSeeder');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente.');

    // Crear admin automáticamente si no existe (solo en producción)
    if (process.env.NODE_ENV === 'production') {
      await seedAdmin(sequelize);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
}

startServer();
