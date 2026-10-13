'use strict';

// El testigo deja su celular para que el dueño pueda contactarlo (llamada o WhatsApp).
// Queda opcional en la base de datos para conservar los avistamientos anteriores; la API lo exige en los nuevos.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('avistamientos', 'telefono_testigo', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'email_testigo',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('avistamientos', 'telefono_testigo');
  },
};
