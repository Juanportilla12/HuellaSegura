const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Notificacion = sequelize.define(
  'Notificacion',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    usuario_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    reporte_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    // En los avisos de avistamiento: dónde y cuándo vieron a la mascota
    avistamiento_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    mensaje:     { type: DataTypes.STRING(255), allowNull: false },
    tipo:        { type: DataTypes.ENUM('proximidad', 'avistamiento'), defaultValue: 'proximidad' },
    leida:       { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'notificaciones', underscored: true }
);

module.exports = Notificacion;
