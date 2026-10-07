/**
 * Pruebas de integración — Flujo completo: QR público
 * Verifica que el ciclo QR → perfil público → privacidad sea correcto.
 */
process.env.JWT_SECRET  = 'test_secret_huella_segura_2026';
process.env.JWT_EXPIRES_IN = '24h';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app     = require('../../src/app');
const { sign } = require('../../src/config/jwt');

jest.mock('../../src/models', () => ({
  Usuario:      { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn(), count: jest.fn() },
  Mascota:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Reporte:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() },
  Notificacion: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), bulkCreate: jest.fn() },
  Avistamiento: { create: jest.fn(), count: jest.fn() },
  EntidadAliada:{ findAll: jest.fn() },
}));
jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

const { Mascota, Reporte } = require('../../src/models');
const TOKEN = sign({ id: 1, rol: 'usuario', tokenVersion: 0 });
const { Usuario } = require('../../src/models');

const MASCOTA_MOCK = {
  id: 7,
  usuario_id: 1,
  nombre: 'Firulais',
  especie: 'perro',
  raza: 'Labrador',
  sexo: 'macho',
  color: 'Dorado',
  descripcion: 'Muy amigable.',
  microchip: null,
  foto_urls: [],
  propietario: { id: 1, nombre: 'Ana García', email: 'ana@example.com' },
  toPublicJSON: () => ({ id: 7, nombre: 'Firulais', especie: 'perro', foto_urls: [] }),
};

describe('Flujo completo: QR público', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Usuario.findByPk.mockResolvedValue({
      id: 1, rol: 'usuario', token_version: 0, activo: true,
      toPublicJSON: () => ({ id: 1 }),
    });
  });

  test('1. Mascota registrada tiene QR generado correctamente', async () => {
    Mascota.findOne.mockResolvedValue(MASCOTA_MOCK);

    const res = await request(app)
      .get('/api/mascotas/7/qr')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    // Verificar firma PNG
    expect(res.body[0]).toBe(0x89); // byte 0 del buffer PNG = \x89
  });

  test('2. El QR apunta a la URL correcta del perfil público', async () => {
    const { generarQR } = require('../../src/services/qrService');
    const { url } = await generarQR(7);

    expect(url).toBe('http://localhost:5173/publico/mascotas/7');
    expect(url).toContain('/publico/mascotas/');
    expect(url).toContain('7');
  });

  test('3. Perfil público es accesible sin autenticación (sin token JWT)', async () => {
    Mascota.findOne.mockResolvedValue(MASCOTA_MOCK);
    Reporte.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/publico/mascotas/77777777-7777-4777-8777-777777777777');
      // IMPORTANTE: sin header Authorization

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mascota.nombre).toBe('Firulais');
  });

  test('4. Perfil público NO expone datos privados del propietario (Ley 1581)', async () => {
    Mascota.findOne.mockResolvedValue(MASCOTA_MOCK);
    Reporte.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/publico/mascotas/77777777-7777-4777-8777-777777777777');

    expect(res.status).toBe(200);
    // El propietario debe aparecer con nombre pero SIN email
    expect(res.body.propietario).toHaveProperty('nombre');
    expect(res.body.propietario).not.toHaveProperty('email');
    // Tampoco debe aparecer el email en ningún otro lugar de la respuesta
    const cuerpoStr = JSON.stringify(res.body);
    expect(cuerpoStr).not.toContain('ana@example.com');
  });
});
