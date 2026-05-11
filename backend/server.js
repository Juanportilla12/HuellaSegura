require('dotenv').config();
const { execSync }  = require('child_process');
const app           = require('./src/app');
const sequelize     = require('./src/config/connection');
const { seedAdmin } = require('./src/seeders/adminSeeder');

const PORT = process.env.PORT || 3001;

async function runMigrations() {
  console.log('⏳ Ejecutando migraciones...');
  try {
    execSync('npx sequelize-cli db:migrate', {
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log('✅ Migraciones ejecutadas correctamente.');
  } catch (err) {
    console.error('❌ Error en migraciones:', err.message);
    // No detenemos el servidor — las tablas podrían ya existir
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida.');
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME}`);

    await runMigrations();

    // Crear admin automáticamente si no existe
    if (process.env.NODE_ENV === 'production') {
      await seedAdmin(sequelize);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`   Entorno: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar:', error.message);
    process.exit(1);
  }
}

startServer();
