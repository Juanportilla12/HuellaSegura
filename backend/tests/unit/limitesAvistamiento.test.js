// Los límites de peticiones solo actúan fuera de desarrollo/pruebas:
// esta suite simula producción.
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test_secret_huella_segura_2026';

const request = require('supertest');

jest.mock('../../src/models', () => ({
  Usuario:      { findByPk: jest.fn() },
  Mascota:      { findByPk: jest.fn() },
  Reporte:      { findOne: jest.fn() },
  Notificacion: { create: jest.fn().mockResolvedValue({}) },
  Avistamiento: { create: jest.fn().mockResolvedValue({ id: 1 }), count: jest.fn() },
  EntidadAliada:{},
}));

jest.mock('../../src/config/connection', () => ({ authenticate: jest.fn(), define: jest.fn() }));

jest.mock('../../src/services/emailService', () => ({
  enviarCorreoAvistamiento: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../src/services/tiempoRealService', () => ({ notificarUsuario: jest.fn() }));

const app = require('../../src/app');
const { Mascota, Reporte, Avistamiento, Notificacion } = require('../../src/models');
const { enviarCorreoAvistamiento } = require('../../src/services/emailService');

const AVISTAMIENTO = { mascota_id: 3, latitud: 1.21, longitud: -77.28, descripcion: 'La vi en el parque' };

beforeEach(() => {
  jest.clearAllMocks();
  Mascota.findByPk.mockResolvedValue({
    id: 3, nombre: 'Luna', propietario: { id: 9, nombre: 'Ana', email: 'ana@example.com' },
  });
  Reporte.findOne.mockResolvedValue({ id: 7 });
});

describe('Correo al dueño por avistamientos', () => {
  test('El primer avistamiento envía correo', async () => {
    Avistamiento.count.mockResolvedValue(0);
    const res = await request(app).post('/api/avistamientos').set('X-Forwarded-For', '10.0.0.1').send(AVISTAMIENTO);
    expect(res.status).toBe(201);
    expect(enviarCorreoAvistamiento).toHaveBeenCalledTimes(1);
  });

  test('Si hubo otro en los últimos 10 min, no se repite el correo pero sí la notificación', async () => {
    Avistamiento.count.mockResolvedValue(1);
    const res = await request(app).post('/api/avistamientos').set('X-Forwarded-For', '10.0.0.2').send(AVISTAMIENTO);
    expect(res.status).toBe(201);
    expect(enviarCorreoAvistamiento).not.toHaveBeenCalled();
    expect(Notificacion.create).toHaveBeenCalledTimes(1);
  });
});

describe('Límite de avistamientos por IP', () => {
  test('La sexta petición en una hora desde la misma IP recibe 429', async () => {
    Avistamiento.count.mockResolvedValue(0);
    const enviar = () => request(app).post('/api/avistamientos').set('X-Forwarded-For', '10.0.0.50').send(AVISTAMIENTO);

    for (let i = 0; i < 5; i += 1) {
      expect((await enviar()).status).toBe(201);
    }
    const bloqueada = await enviar();
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.message).toMatch(/avistamientos seguidos/);
  });

  test('Otra IP no se ve afectada', async () => {
    Avistamiento.count.mockResolvedValue(0);
    const res = await request(app).post('/api/avistamientos').set('X-Forwarded-For', '10.0.0.99').send(AVISTAMIENTO);
    expect(res.status).toBe(201);
  });
});
