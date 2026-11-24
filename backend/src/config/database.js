require('dotenv').config();

// En Railway, el servicio MySQL publica MYSQLHOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER y
// MYSQLPASSWORD. Si el backend no definió las DB_* equivalentes, se usan esas.
const RESPALDO_RAILWAY = {
  DB_HOST: 'MYSQLHOST', DB_PORT: 'MYSQLPORT', DB_NAME: 'MYSQLDATABASE', DB_USER: 'MYSQLUSER', DB_PASSWORD: 'MYSQLPASSWORD',
};
Object.entries(RESPALDO_RAILWAY).forEach(([propia, railway]) => {
  if (!process.env[propia] && process.env[railway]) process.env[propia] = process.env[railway];
});

// En producción la conexión debe venir completa del entorno. Sin esta
// verificación, sequelize-cli intentaría conectarse a localhost y el error
// (ECONNREFUSED ::1:3306) no diría qué falta.
if (process.env.NODE_ENV === 'production') {
  const faltantes = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter((v) => !process.env[v]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de base de datos: ${faltantes.join(', ')}`);
  }
}

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'huella_segura',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME_TEST || 'huella_segura_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
};
