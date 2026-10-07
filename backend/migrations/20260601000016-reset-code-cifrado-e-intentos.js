'use strict';

// El código de recuperación se guarda cifrado (bcrypt) y se limita a 5
// intentos. Los códigos vigentes en texto plano se invalidan (duran 15 min).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('UPDATE usuarios SET reset_code = NULL, reset_code_expires = NULL');
    await queryInterface.changeColumn('usuarios', 'reset_code', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'reset_intentos', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      after: 'reset_code_expires',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'reset_intentos');
    await queryInterface.sequelize.query('UPDATE usuarios SET reset_code = NULL, reset_code_expires = NULL');
    await queryInterface.changeColumn('usuarios', 'reset_code', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });
  },
};
