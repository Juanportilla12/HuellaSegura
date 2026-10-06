// Verifica al arrancar que existan las variables de entorno obligatorias.
const OBLIGATORIAS = ['JWT_SECRET'];
const OBLIGATORIAS_PRODUCCION = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'FRONTEND_URL',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  'EMAIL_USER', 'EMAIL_PASS',
];

function validarEntorno() {
  const requeridas = process.env.NODE_ENV === 'production'
    ? [...OBLIGATORIAS, ...OBLIGATORIAS_PRODUCCION]
    : OBLIGATORIAS;

  const faltantes = requeridas.filter((nombre) => !process.env[nombre]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
  }
}

module.exports = { validarEntorno };
