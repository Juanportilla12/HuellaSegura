'use strict';

// Seguridad de cuentas:
// - Verificación del correo al registrarse: la cuenta queda pendiente hasta que se escribe
//   el código enviado al correo (así nadie registra un correo que no es suyo). Las cuentas
//   que ya existían quedan como verificadas para no bloquear a sus dueños.
// - Bloqueo temporal de la cuenta tras varias contraseñas incorrectas seguidas.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'email_verificado', {
      type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true, after: 'email',
    });
    await queryInterface.addColumn('usuarios', 'verificacion_code', {
      type: Sequelize.STRING(100), allowNull: true, after: 'email_verificado', // hash bcrypt, nunca el código
    });
    await queryInterface.addColumn('usuarios', 'verificacion_expira', {
      type: Sequelize.DATE, allowNull: true, after: 'verificacion_code',
    });
    await queryInterface.addColumn('usuarios', 'verificacion_intentos', {
      type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, after: 'verificacion_expira',
    });
    await queryInterface.addColumn('usuarios', 'verificacion_enviada', {
      type: Sequelize.DATE, allowNull: true, after: 'verificacion_intentos',
    });
    await queryInterface.addColumn('usuarios', 'login_fallidos', {
      type: Sequelize.INTEGER, allowNull: false, defaultValue: 0,
    });
    await queryInterface.addColumn('usuarios', 'bloqueado_hasta', {
      type: Sequelize.DATE, allowNull: true,
    });
  },

  async down(queryInterface) {
    for (const columna of ['bloqueado_hasta', 'login_fallidos', 'verificacion_enviada', 'verificacion_intentos',
      'verificacion_expira', 'verificacion_code', 'email_verificado']) {
      await queryInterface.removeColumn('usuarios', columna);
    }
  },
};
