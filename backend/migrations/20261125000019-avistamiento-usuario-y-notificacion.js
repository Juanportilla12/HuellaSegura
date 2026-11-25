'use strict';

// - avistamientos.usuario_id: quién reportó el avistamiento si tenía sesión iniciada, para
//   mostrarlo en "Mis reportes". Opcional: también se puede reportar sin cuenta.
// - notificaciones.avistamiento_id: la notificación al dueño apunta al avistamiento, para
//   mostrar dónde VIERON a la mascota (antes solo apuntaba al reporte de pérdida y el
//   mapa mostraba dónde se perdió).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('avistamientos', 'usuario_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      after: 'reporte_id',
      references: { model: 'usuarios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('notificaciones', 'avistamiento_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      after: 'reporte_id',
      references: { model: 'avistamientos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('notificaciones', 'avistamiento_id');
    await queryInterface.removeColumn('avistamientos', 'usuario_id');
  },
};
