'use strict';

// La migración 7 intentó eliminar la FK 'notificaciones_ibfk_3', pero MySQL la
// había creado como 'notificaciones_ibfk_2' y el error se ignoró. Resultado:
// reporte_id quedó con dos FK (CASCADE y SET NULL) y prevalecía CASCADE.
// Esta migración elimina cualquier FK de reporte_id distinta de la correcta
// (ON DELETE SET NULL), sin depender del nombre generado por MySQL.
const FK_CORRECTA = 'notificaciones_reporte_id_fk';

async function fksDeReporte(queryInterface) {
  const [filas] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME AS nombre
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'notificaciones'
        AND COLUMN_NAME = 'reporte_id'
        AND REFERENCED_TABLE_NAME = 'reportes'`
  );
  return filas.map((f) => f.nombre);
}

module.exports = {
  async up(queryInterface) {
    const nombres = await fksDeReporte(queryInterface);
    for (const nombre of nombres) {
      if (nombre !== FK_CORRECTA) {
        await queryInterface.removeConstraint('notificaciones', nombre);
      }
    }
    if (!nombres.includes(FK_CORRECTA)) {
      await queryInterface.addConstraint('notificaciones', {
        fields: ['reporte_id'],
        type: 'foreign key',
        name: FK_CORRECTA,
        references: { table: 'reportes', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  // No se restaura la FK duplicada: era un error, no un estado válido.
  async down() {},
};
