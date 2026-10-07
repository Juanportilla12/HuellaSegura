const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Mascota = sequelize.define(
  'Mascota',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    // Identificador público no adivinable (QR y enlaces compartidos)
    codigo_publico: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la mascota no puede estar vacío.' },
        len: { args: [1, 100], msg: 'El nombre debe tener entre 1 y 100 caracteres.' },
      },
    },
    especie: {
      type: DataTypes.ENUM('perro', 'gato', 'ave', 'reptil', 'otro'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La especie es obligatoria.' },
      },
    },
    raza: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    edad: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    edad_unidad: {
      type: DataTypes.ENUM('meses', 'años'),
      defaultValue: 'años',
    },
    sexo: {
      type: DataTypes.ENUM('macho', 'hembra'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El sexo es obligatorio.' },
      },
    },
    color: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El color es obligatorio.' },
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    microchip: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    foto_urls: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: 'mascotas',
    underscored: true,
  }
);

Mascota.prototype.toPublicJSON = function () {
  return {
    id: this.id,
    codigo_publico: this.codigo_publico,
    usuario_id: this.usuario_id,
    nombre: this.nombre,
    especie: this.especie,
    raza: this.raza,
    edad: this.edad,
    edad_unidad: this.edad_unidad,
    sexo: this.sexo,
    color: this.color,
    descripcion: this.descripcion,
    microchip: this.microchip,
    foto_urls: this.foto_urls || [],
    foto_principal: (this.foto_urls || [])[0] || null,
    video_url: this.video_url || null,
    created_at: this.created_at,
  };
};

module.exports = Mascota;
