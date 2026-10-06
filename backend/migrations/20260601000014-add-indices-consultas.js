'use strict';

// Sprint 9 (RNF-02): índices en los campos más consultados
// (fecha de creación, especie y coordenadas de los reportes).
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('reportes', ['estado', 'moderado', 'created_at'], { name: 'idx_reportes_activos_fecha' });
    await queryInterface.addIndex('reportes', ['latitud', 'longitud'], { name: 'idx_reportes_coordenadas' });
    await queryInterface.addIndex('mascotas', ['especie'], { name: 'idx_mascotas_especie' });
    await queryInterface.addIndex('avistamientos', ['created_at'], { name: 'idx_avistamientos_fecha' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('reportes', 'idx_reportes_activos_fecha');
    await queryInterface.removeIndex('reportes', 'idx_reportes_coordenadas');
    await queryInterface.removeIndex('mascotas', 'idx_mascotas_especie');
    await queryInterface.removeIndex('avistamientos', 'idx_avistamientos_fecha');
  },
};
