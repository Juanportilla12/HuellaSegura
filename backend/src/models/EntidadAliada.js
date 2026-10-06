const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const EntidadAliada = sequelize.define(
  'EntidadAliada',
  {
    id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nombre:      { type: DataTypes.STRING(150), allowNull: false },
    tipo:        { type: DataTypes.ENUM('veterinaria', 'albergue', 'otro'), allowNull: false },
    direccion:   { type: DataTypes.STRING(255), allowNull: true },
    telefono:    { type: DataTypes.STRING(20),  allowNull: true },
    horario:     { type: DataTypes.STRING(150), allowNull: true },
    latitud:     { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    longitud:    { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    activo:      { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'entidades_aliadas', underscored: true }
);

module.exports = EntidadAliada;
