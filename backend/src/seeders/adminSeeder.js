'use strict';
const bcrypt = require('bcryptjs');

// Crea el usuario administrador inicial a partir de variables de entorno.
// Si ADMIN_EMAIL o ADMIN_PASSWORD no están definidas, no hace nada.
async function seedAdmin(sequelize) {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nombre   = process.env.ADMIN_NOMBRE || 'Administrador';

  if (!email || !password) {
    console.warn('[Seeder] ADMIN_EMAIL/ADMIN_PASSWORD no definidas: no se crea el admin.');
    return;
  }

  try {
    const [rows] = await sequelize.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      { replacements: [email] }
    );
    if (rows.length > 0) return; // Ya existe, no hacer nada

    const hash = await bcrypt.hash(password, 12);
    await sequelize.query(
      `INSERT INTO usuarios (nombre, email, password, rol, activo, radio_alerta, token_version, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', 1, 5, 0, NOW(), NOW())`,
      { replacements: [nombre, email, hash] }
    );
    console.log('[Seeder] Admin creado correctamente.');
  } catch (err) {
    console.error('[Seeder] Error al crear admin:', err.message);
  }
}

module.exports = { seedAdmin };
