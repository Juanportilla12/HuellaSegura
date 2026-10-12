// Formatos compartidos por varias rutas

// Celular: 7 a 15 dígitos, opcionalmente con + inicial, espacios o guiones (p. ej. 300 123 4567)
const CELULAR_REGEX = /^\+?[0-9][0-9\s-]{6,18}$/;

module.exports = { CELULAR_REGEX };
