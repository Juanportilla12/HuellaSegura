const sequelize     = require('../config/connection');
const Usuario       = require('./Usuario');
const Mascota       = require('./Mascota');
const Reporte       = require('./Reporte');
const Notificacion  = require('./Notificacion');
const Avistamiento  = require('./Avistamiento');
const EntidadAliada = require('./EntidadAliada');

Usuario.hasMany(Mascota,      { foreignKey: 'usuario_id', as: 'mascotas' });
Mascota.belongsTo(Usuario,    { foreignKey: 'usuario_id', as: 'propietario' });

Usuario.hasMany(Reporte,      { foreignKey: 'usuario_id', as: 'reportes' });
Reporte.belongsTo(Usuario,    { foreignKey: 'usuario_id', as: 'reportante' });

Mascota.hasMany(Reporte,      { foreignKey: 'mascota_id', as: 'reportes' });
Reporte.belongsTo(Mascota,    { foreignKey: 'mascota_id', as: 'mascota' });

Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'destinatario' });

Reporte.hasMany(Notificacion, { foreignKey: 'reporte_id', as: 'notificaciones' });
Notificacion.belongsTo(Reporte, { foreignKey: 'reporte_id', as: 'reporte' });

Mascota.hasMany(Avistamiento,  { foreignKey: 'mascota_id', as: 'avistamientos' });
Avistamiento.belongsTo(Mascota, { foreignKey: 'mascota_id', as: 'mascota' });

Reporte.hasMany(Avistamiento,  { foreignKey: 'reporte_id', as: 'avistamientos' });
Avistamiento.belongsTo(Reporte, { foreignKey: 'reporte_id', as: 'reporte' });

Usuario.hasMany(Avistamiento,  { foreignKey: 'usuario_id', as: 'avistamientosReportados' });
Avistamiento.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'testigo' });

Avistamiento.hasMany(Notificacion,  { foreignKey: 'avistamiento_id', as: 'notificaciones' });
Notificacion.belongsTo(Avistamiento, { foreignKey: 'avistamiento_id', as: 'avistamiento' });

const db = { sequelize, Usuario, Mascota, Reporte, Notificacion, Avistamiento, EntidadAliada };
module.exports = db;
