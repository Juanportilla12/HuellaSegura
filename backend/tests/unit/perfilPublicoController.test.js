process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/models', () => ({
  Usuario:      { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Mascota:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Reporte:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Notificacion: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), bulkCreate: jest.fn() },
  Avistamiento: { create: jest.fn(), count: jest.fn().mockResolvedValue(0) },
}));

jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

const { Mascota, Reporte } = require('../../src/models');

function buildMockMascota(overrides = {}) {
  return {
    id: 1,
    nombre: 'Firulais',
    especie: 'perro',
    raza: 'Labrador',
    sexo: 'macho',
    color: 'Dorado',
    descripcion: 'Muy amigable',
    microchip: null,
    foto_urls: ['https://res.cloudinary.com/test/perro.jpg'],
    propietario: { id: 1, nombre: 'Ana García' },
    ...overrides,
  };
}

describe('PerfilPublico', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /api/publico/mascotas/:id → 200 sin token JWT', async () => {
    Mascota.findByPk.mockResolvedValue(buildMockMascota());
    Reporte.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/publico/mascotas/1');
    // Verificar que NO se usa el header de auth
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Muestra solo datos públicos — sin email del propietario', async () => {
    Mascota.findByPk.mockResolvedValue(buildMockMascota());
    Reporte.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/publico/mascotas/1');

    expect(res.body.propietario).toHaveProperty('nombre');
    expect(res.body.propietario).not.toHaveProperty('email');
    expect(res.body.mascota).toHaveProperty('nombre', 'Firulais');
  });

  test('Retorna 404 si la mascota no existe', async () => {
    Mascota.findByPk.mockResolvedValue(null);

    const res = await request(app).get('/api/publico/mascotas/999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Incluye reporte_activo cuando existe', async () => {
    Mascota.findByPk.mockResolvedValue(buildMockMascota());
    Reporte.findOne.mockResolvedValue({
      id: 5, latitud: 1.2136, longitud: -77.2811,
      descripcion: 'Se perdió en el parque', fecha_perdida: '2026-04-20',
    });

    const res = await request(app).get('/api/publico/mascotas/1');

    expect(res.status).toBe(200);
    expect(res.body.reporte_activo).not.toBeNull();
    expect(res.body.reporte_activo.id).toBe(5);
  });

  test('reporte_activo es null cuando no hay reporte activo', async () => {
    Mascota.findByPk.mockResolvedValue(buildMockMascota());
    Reporte.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/publico/mascotas/1');

    expect(res.status).toBe(200);
    expect(res.body.reporte_activo).toBeNull();
  });
});

describe('HU-29 — Página para compartir con vista previa', () => {
  test('Devuelve HTML con Open Graph y redirección al perfil público', async () => {
    Mascota.findByPk.mockResolvedValue({
      id: 5, nombre: 'Toby <b>', especie: 'perro', raza: null, color: 'café',
      foto_urls: ['https://res.cloudinary.com/x/image/upload/toby.jpg'],
    });
    Reporte.findOne.mockResolvedValue({ id: 3 });

    const res = await request(app).get('/api/publico/compartir/mascotas/5');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('og:image" content="https://res.cloudinary.com/x/image/upload/toby.jpg"');
    expect(res.text).toContain('/publico/mascotas/5');
    expect(res.text).toContain('Toby &lt;b&gt;');
    expect(res.text).not.toContain('Toby <b>');
  });

  test('404 si la mascota no existe', async () => {
    Mascota.findByPk.mockResolvedValue(null);
    const res = await request(app).get('/api/publico/compartir/mascotas/999');
    expect(res.status).toBe(404);
  });
});
