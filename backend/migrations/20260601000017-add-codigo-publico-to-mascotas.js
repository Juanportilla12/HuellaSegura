'use strict';
const crypto = require('crypto');

// Ley 1581: el perfil público (QR) usa un código aleatorio no adivinable en lugar
// del id numérico, para que no se puedan recorrer los perfiles y extraer teléfonos.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('mascotas', 'codigo_publico', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      after: 'usuario_id',
    });
    // UUID v4 aleatorio para las mascotas existentes (UUID() de MySQL es v1, basado en tiempo)
    const [filas] = await queryInterface.sequelize.query('SELECT id FROM mascotas WHERE codigo_publico IS NULL');
    for (const { id } of filas) {
      await queryInterface.sequelize.query('UPDATE mascotas SET codigo_publico = ? WHERE id = ?', {
        replacements: [crypto.randomUUID(), id],
      });
    }
    await queryInterface.changeColumn('mascotas', 'codigo_publico', {
      type: Sequelize.CHAR(36),
      allowNull: false,
    });
    await queryInterface.addIndex('mascotas', ['codigo_publico'], { unique: true, name: 'idx_mascotas_codigo_publico' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('mascotas', 'idx_mascotas_codigo_publico');
    await queryInterface.removeColumn('mascotas', 'codigo_publico');
  },
};
