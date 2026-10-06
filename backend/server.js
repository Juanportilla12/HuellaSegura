require('dotenv').config();
const { validarEntorno } = require('./src/config/env');
const app           = require('./src/app');
const sequelize     = require('./src/config/connection');
const { seedAdmin } = require('./src/seeders/adminSeeder');

const PORT = process.env.PORT || 3001;

// Las migraciones se ejecutan antes de arrancar con `npm run migrate`
// (ver railway.json y README).
async function startServer() {
  try {
    validarEntorno();
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida.');

    // Crear admin inicial si no existe (requiere ADMIN_EMAIL y ADMIN_PASSWORD)
    if (process.env.NODE_ENV === 'production') {
      await seedAdmin(sequelize);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT} (${process.env.NODE_ENV})`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar:', error.message);
    process.exit(1);
  }
}

startServer();
