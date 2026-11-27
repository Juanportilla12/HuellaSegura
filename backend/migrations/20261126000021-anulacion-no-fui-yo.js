'use strict';

// Enlace "¿No fuiste tú?" de los correos con código (verificación de la cuenta y
// recuperación de la contraseña): anula el código y, si la cuenta nunca se verificó,
// cancela ese registro. Se guarda solo el hash SHA-256 de la clave del enlace.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'anulacion_token', {
      type: Sequelize.STRING(64), allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'anulacion_expira', {
      type: Sequelize.DATE, allowNull: true,
    });
    await queryInterface.addIndex('usuarios', ['anulacion_token'], { name: 'idx_usuarios_anulacion_token' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('usuarios', 'idx_usuarios_anulacion_token');
    await queryInterface.removeColumn('usuarios', 'anulacion_expira');
    await queryInterface.removeColumn('usuarios', 'anulacion_token');
  },
};
