const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Avistamiento = sequelize.define(
  'Avistamiento',
  {
    id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    mascota_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    reporte_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    latitud:        { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    longitud:       { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    descripcion:    { type: DataTypes.TEXT, allowNull: true },
    foto_url:       { type: DataTypes.STRING(500), allowNull: true },
    nombre_testigo: { type: DataTypes.STRING(100), allowNull: true },
    email_testigo:  { type: DataTypes.STRING(150), allowNull: true },
    telefono_testigo: { type: DataTypes.STRING(20), allowNull: true },
  },
  { tableName: 'avistamientos', underscored: true }
);

module.exports = Avistamiento;
