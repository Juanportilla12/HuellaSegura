'use strict';

// R5 cargaVideos: un video por mascota, almacenado en Cloudinary.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('mascotas', 'video_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'foto_urls',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('mascotas', 'video_url');
  },
};
