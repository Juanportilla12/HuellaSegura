/**
 * Sprint 6 — Definition of Done
 * Avistamientos, QR y perfil público
 */
process.env.JWT_SECRET     = 'test_secret_huella_segura_2026';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV       = 'test';

const request  = require('supertest');
const app      = require('../../src/app');
const { sign } = require('../../src/config/jwt');
const QRCode   = require('qrcode');

jest.mock('../../src/models', () => ({
  Usuario:      { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Mascota:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Reporte:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Avistamiento: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn().mockResolvedValue(0) },
  Notificacion: { create: jest.fn().mockResolvedValue({}), bulkCreate: jest.fn().mockResolvedValue([]) },
}));
jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({ sendMail: jest.fn().mockResolvedValue(true) }),
}));
jest.mock('../../src/config/cloudinary', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/foto.jpg' }),
  deleteImage:  jest.fn().mockResolvedValue({}),
}));

const { Usuario, Mascota, Reporte, Avistamiento } = require('../../src/models');

const TOKEN = sign({ id: 1, rol: 'usuario', tokenVersion: 0 });

const mockUsuario = {
  id: 1, nombre: 'Ana', email: 'ana@test.com',
  rol: 'usuario', token_version: 0, activo: true,
  toPublicJSON: jest.fn().mockReturnValue({ id: 1, nombre: 'Ana' }),
};

function buildMascota(o = {}) {
  return {
    id: 1, nombre: 'Max', especie: 'perro', usuario_id: 1,
    foto_urls: ['https://res.cloudinary.com/test/max.jpg'],
    toPublicJSON: jest.fn().mockReturnValue({ id: 1, nombre: 'Max', especie: 'perro' }),
    getUsuario: jest.fn().mockResolvedValue(mockUsuario),
    ...o,
  };
}

function buildReporte(o = {}) {
  return {
    id: 1, mascota_id: 1, estado: 'en_busqueda',
    latitud: '1.2136', longitud: '-77.2811',
    ...o,
  };
}

describe('Sprint 6 — Avistamientos, QR y perfil público (DoD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Usuario.findByPk.mockResolvedValue(mockUsuario);
  });

  // ── Criterio 1: Registrar avistamiento — ruta pública (sin token) ──────────
  test('C1 — Registra avistamiento con coordenadas → 201', async () => {
    // El controlador usa findByPk con include de propietario
    Mascota.findByPk.mockResolvedValue({
      ...buildMascota(),
      propietario: { id: 1, nombre: 'Ana', email: 'ana@test.com' },
    });
    Reporte.findOne.mockResolvedValue(buildReporte());
    Avistamiento.create.mockResolvedValue({
      id: 1, mascota_id: 1, latitud: 1.2136, longitud: -77.2811,
      toJSON: jest.fn().mockReturnValue({ id: 1 }),
    });
    // Ruta pública — NO requiere token
    const res = await request(app)
      .post('/api/avistamientos')
      .send({ mascota_id: 1, latitud: 1.2136, longitud: -77.2811 });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  test('C1 — Sin coordenadas rechazado → 400', async () => {
    const res = await request(app)
      .post('/api/avistamientos')
      .send({ mascota_id: 1 });       // sin latitud/longitud
    expect(res.status).toBe(400);
  });

  test('C1 — Sin mascota_id rechazado → 400', async () => {
    const res = await request(app)
      .post('/api/avistamientos')
      .send({ latitud: 1.2136, longitud: -77.2811 });
    expect(res.status).toBe(400);
  });

  // ── Criterio 3 y 4: QR único por mascota, descargable en PNG ─────────────
  test('C3 — QR genera data URL base64 válida', async () => {
    const url = 'http://localhost:5173/publico/mascotas/1';
    const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'H' });
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  test('C4 — QR distintos IDs generan códigos distintos (unicidad)', async () => {
    const qr1 = await QRCode.toDataURL('http://localhost:5173/publico/mascotas/1');
    const qr2 = await QRCode.toDataURL('http://localhost:5173/publico/mascotas/2');
    expect(qr1).not.toBe(qr2);
  });

  test('C4 — GET /api/mascotas/:id/qr → responde con QR', async () => {
    Mascota.findOne.mockResolvedValue(buildMascota());
    const res = await request(app)
      .get('/api/mascotas/1/qr')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect([200, 201]).toContain(res.status);
  });

  // ── Criterio 5: Perfil público sin login ─────────────────────────────────
  // El controlador accede a mascota.propietario.id directamente (Sequelize include)
  function buildMascotaPublica(o = {}) {
    return {
      id: 1, nombre: 'Max', especie: 'perro', raza: 'Labrador',
      sexo: 'macho', color: 'dorado', descripcion: 'Amigable',
      microchip: null, foto_urls: ['https://res.cloudinary.com/test/max.jpg'],
      propietario: { id: 1, nombre: 'Ana' },   // ← acceso directo del controlador
      ...o,
    };
  }

  test('C5 — Perfil público accesible sin Authorization header → 200', async () => {
    Mascota.findByPk.mockResolvedValue(buildMascotaPublica());
    Reporte.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/publico/mascotas/1');
    expect(res.status).toBe(200);
    expect(res.body.mascota).toBeDefined();
  });

  test('C5 — Perfil público incluye info del propietario', async () => {
    Mascota.findByPk.mockResolvedValue(buildMascotaPublica());
    Reporte.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/publico/mascotas/1');
    expect(res.status).toBe(200);
    expect(res.body.propietario).toBeDefined();
    expect(res.body.propietario.nombre).toBe('Ana');
  });

  test('C5 — Perfil público de mascota inexistente → 404', async () => {
    Mascota.findByPk.mockResolvedValue(null);
    const res = await request(app).get('/api/publico/mascotas/999');
    expect(res.status).toBe(404);
  });

  test('C5 — Perfil público muestra reporte_activo si hay pérdida activa', async () => {
    Mascota.findByPk.mockResolvedValue(buildMascotaPublica());
    Reporte.findOne.mockResolvedValue(buildReporte());
    const res = await request(app).get('/api/publico/mascotas/1');
    expect(res.status).toBe(200);
    expect(res.body.reporte_activo).not.toBeNull();
  });
});
