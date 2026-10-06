'use strict';

// R1 registroUsuario: el registro incluye número de celular.
// Es opcional en la base de datos para no invalidar cuentas existentes;
// el formulario de registro lo exige.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'celular', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'email',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuarios', 'celular');
  },
};
