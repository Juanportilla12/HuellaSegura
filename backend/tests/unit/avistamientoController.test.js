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

jest.mock('../../src/config/cloudinary', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/foto.jpg' }),
  deleteImage:  jest.fn(),
}));

const { Mascota, Reporte, Notificacion, Avistamiento } = require('../../src/models');

const MASCOTA_MOCK = {
  id: 1,
  nombre: 'Firulais',
  especie: 'perro',
  propietario: { id: 10, nombre: 'Ana García', email: 'ana@example.com' },
};

const PAYLOAD = {
  mascota_id: 1,
  latitud: 1.2136,
  longitud: -77.2811,
  descripcion: 'Lo vi cerca del parque',
  nombre_testigo: 'Carlos',
};

describe('AvistamientoController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Mascota.findByPk.mockResolvedValue(MASCOTA_MOCK);
    Reporte.findOne.mockResolvedValue({ id: 5 });
    Avistamiento.create.mockResolvedValue({ id: 99 });
    Notificacion.create.mockResolvedValue({ id: 1 });
  });

  test('POST /api/avistamientos → 201 sin requerir autenticación', async () => {
    const res = await request(app)
      .post('/api/avistamientos')
      .send(PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('Genera notificación al propietario al crear avistamiento', async () => {
    await request(app).post('/api/avistamientos').send(PAYLOAD);

    expect(Notificacion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_id: 10,
        tipo: 'avistamiento',
      })
    );
  });

  test('Asocia el avistamiento al reporte activo correcto', async () => {
    await request(app).post('/api/avistamientos').send(PAYLOAD);

    expect(Avistamiento.create).toHaveBeenCalledWith(
      expect.objectContaining({ mascota_id: 1, reporte_id: 5 })
    );
  });

  test('400 si falta la mascota_id', async () => {
    const res = await request(app).post('/api/avistamientos')
      .send({ latitud: 1.2136, longitud: -77.2811 });
    expect(res.status).toBe(400);
  });

  test('400 si faltan las coordenadas GPS', async () => {
    const res = await request(app).post('/api/avistamientos')
      .send({ mascota_id: 1 });
    expect(res.status).toBe(400);
  });

  test('404 si la mascota no existe', async () => {
    Mascota.findByPk.mockResolvedValue(null);
    const res = await request(app).post('/api/avistamientos').send(PAYLOAD);
    expect(res.status).toBe(404);
  });
});
