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

jest.mock('../../src/services/emailService', () => ({
  enviarCorreoAvistamiento: jest.fn().mockResolvedValue({}),
}));

const { Mascota, Reporte, Notificacion, Avistamiento } = require('../../src/models');
const { enviarCorreoAvistamiento } = require('../../src/services/emailService');

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
  telefono_testigo: '300 123 4567',
};

// Envía el avistamiento como multipart (como la app), con o sin foto
function enviar(campos = PAYLOAD, { foto = true } = {}) {
  let req = request(app).post('/api/avistamientos');
  Object.entries(campos).forEach(([k, v]) => { req = req.field(k, String(v)); });
  if (foto) req = req.attach('foto', Buffer.from('foto-de-prueba'), { filename: 'foto.jpg', contentType: 'image/jpeg' });
  return req;
}

describe('AvistamientoController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Mascota.findByPk.mockResolvedValue(MASCOTA_MOCK);
    Reporte.findOne.mockResolvedValue({ id: 5 });
    Avistamiento.create.mockResolvedValue({ id: 99 });
    Notificacion.create.mockResolvedValue({ id: 1 });
  });

  test('POST /api/avistamientos → 201 sin requerir autenticación', async () => {
    const res = await enviar();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('Genera notificación al propietario al crear avistamiento', async () => {
    await enviar();

    expect(Notificacion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_id: 10,
        tipo: 'avistamiento',
      })
    );
  });

  test('Asocia el avistamiento al reporte activo correcto', async () => {
    await enviar();

    expect(Avistamiento.create).toHaveBeenCalledWith(
      expect.objectContaining({ mascota_id: '1', reporte_id: 5 })
    );
  });

  test('Guarda el celular del testigo y se lo hace llegar al dueño', async () => {
    await enviar();

    expect(Avistamiento.create).toHaveBeenCalledWith(
      expect.objectContaining({ telefono_testigo: '300 123 4567', foto_url: 'https://res.cloudinary.com/test/foto.jpg' })
    );
    expect(Notificacion.create.mock.calls[0][0].mensaje).toContain('300 123 4567');
    expect(enviarCorreoAvistamiento).toHaveBeenCalledWith(
      expect.objectContaining({ avistamiento: expect.objectContaining({ telefono_testigo: '300 123 4567' }) })
    );
  });

  test('400 si falta el celular del testigo', async () => {
    const { telefono_testigo: _omitido, ...sinTelefono } = PAYLOAD;
    const res = await enviar(sinTelefono);
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/celular es obligatorio/);
    expect(Avistamiento.create).not.toHaveBeenCalled();
  });

  test('400 si el celular del testigo no es válido', async () => {
    const res = await enviar({ ...PAYLOAD, telefono_testigo: 'abc' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/celular válido/);
  });

  test('400 si falta la foto', async () => {
    const res = await enviar(PAYLOAD, { foto: false });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/foto es obligatoria/);
    expect(Avistamiento.create).not.toHaveBeenCalled();
  });

  test('400 si falta la mascota_id', async () => {
    const { mascota_id: _omitido, ...sinMascota } = PAYLOAD;
    const res = await enviar(sinMascota);
    expect(res.status).toBe(400);
  });

  test('400 si faltan las coordenadas GPS', async () => {
    const res = await enviar({ mascota_id: 1, telefono_testigo: '3001234567' });
    expect(res.status).toBe(400);
  });

  test('404 si la mascota no existe', async () => {
    Mascota.findByPk.mockResolvedValue(null);
    const res = await enviar();
    expect(res.status).toBe(404);
  });
});
