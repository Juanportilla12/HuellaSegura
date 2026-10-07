const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Reporte = sequelize.define(
  'Reporte',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    mascota_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: { args: [-90], msg: 'Latitud inválida.' },
        max: { args: [90], msg: 'Latitud inválida.' },
      },
    },
    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: { args: [-180], msg: 'Longitud inválida.' },
        max: { args: [180], msg: 'Longitud inválida.' },
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('en_busqueda', 'encontrada', 'cerrado'),
      defaultValue: 'en_busqueda',
    },
    fecha_perdida: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    moderado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'reportes',
    underscored: true,
  }
);

Reporte.prototype.toPublicJSON = function () {
  return {
    id: this.id,
    mascota_id: this.mascota_id,
    usuario_id: this.usuario_id,
    latitud: parseFloat(this.latitud),
    longitud: parseFloat(this.longitud),
    descripcion: this.descripcion,
    estado: this.estado,
    fecha_perdida: this.fecha_perdida,
    created_at: this.created_at,
    mascota: this.mascota ? {
      id: this.mascota.id,
      codigo_publico: this.mascota.codigo_publico,
      nombre: this.mascota.nombre,
      especie: this.mascota.especie,
      raza: this.mascota.raza || null,
      sexo: this.mascota.sexo || null,
      color: this.mascota.color || null,
      foto_principal: (this.mascota.foto_urls || [])[0] || null,
    } : undefined,
    propietario: this.reportante ? {
      id: this.reportante.id,
      nombre: this.reportante.nombre,
    } : undefined,
  };
};

module.exports = Reporte;
