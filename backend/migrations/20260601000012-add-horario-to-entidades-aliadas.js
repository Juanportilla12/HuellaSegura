'use strict';

// HU-27: el directorio de aliados muestra el horario de atención de cada entidad.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('entidades_aliadas', 'horario', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'telefono',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('entidades_aliadas', 'horario');
  },
};
