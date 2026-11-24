// Formatos compartidos por varias rutas

// Celular: 7 a 15 dígitos, opcionalmente con + inicial y un espacio o guion entre
// dígitos (p. ej. 300 123 4567 o 300-123-4567). No acepta solo guiones o espacios.
const CELULAR_REGEX = /^\+?[0-9](?:[\s-]?[0-9]){6,14}$/;

module.exports = { CELULAR_REGEX };
