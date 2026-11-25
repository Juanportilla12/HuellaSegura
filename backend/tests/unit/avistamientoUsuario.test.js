/**
 * Avistamientos asociados a quien los reporta, avisos al dueño con la ubicación del
 * avistamiento y bloqueo de avistamientos sobre la mascota propia.
 */
process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.NODE_ENV   = 'test';

const request  = require('supertest');
const app      = require('../../src/app');
const { sign } = require('../../src/config/jwt');

jest.mock('../../src/models', () => ({
  Usuario:      { findOne: jest.fn(), findByPk: jest.fn() },
  Mascota:      { findOne: jest.fn(), findByPk: jest.fn() },
  Reporte:      { findOne: jest.fn() },
  Avistamiento: { create: jest.fn(), findAll: jest.fn(), count: jest.fn().mockResolvedValue(0) },
  Notificacion: { create: jest.fn().mockResolvedValue({}), findAll: jest.fn() },
}));
jest.mock('../../src/config/connection', () => ({ authenticate: jest.fn(), define: jest.fn() }));
jest.mock('../../src/services/emailService', () => ({ enviarCorreoAvistamiento: jest.fn().mockResolvedValue({}) }));
jest.mock('../../src/config/cloudinary', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/foto.jpg' }),
}));

const { Usuario, Mascota, Reporte, Avistamiento, Notificacion } = require('../../src/models');

const usuario = (id, nombre) => ({ id, nombre, rol: 'usuario', token_version: 0, activo: true });
const DUENO = usuario(1, 'Victor Rosas');
const TESTIGO = usuario(2, 'Juan Portilla');
const token = (u) => sign({ id: u.id, rol: 'usuario', tokenVersion: 0 });

function enviarAvistamiento(tokenUsuario) {
  const req = request(app).post('/api/avistamientos');
  if (tokenUsuario) req.set('Authorization', `Bearer ${tokenUsuario}`);
  return req
    .field('mascota_id', '7').field('latitud', '1.2001').field('longitud', '-77.2999')
    .field('telefono_testigo', '3001234567')
    .attach('foto', Buffer.from('foto'), { filename: 'foto.jpg', contentType: 'image/jpeg' });
}

beforeEach(() => {
  jest.clearAllMocks();
  Usuario.findByPk.mockImplementation(async (id) => [DUENO, TESTIGO].find((u) => u.id === id) || null);
  Mascota.findByPk.mockResolvedValue({ id: 7, nombre: 'Batman', usuario_id: 1, propietario: { id: 1, nombre: 'Victor', email: 'v@x.com' } });
  Reporte.findOne.mockResolvedValue({ id: 30, estado: 'en_busqueda' });
  Avistamiento.create.mockImplementation(async (d) => ({ id: 99, ...d }));
});

describe('Avistamientos y usuario', () => {
  test('Con sesión iniciada, el avistamiento queda asociado a quien lo reportó', async () => {
    const res = await enviarAvistamiento(token(TESTIGO));
    expect(res.status).toBe(201);
    expect(Avistamiento.create.mock.calls[0][0]).toMatchObject({ usuario_id: 2, nombre_testigo: 'Juan Portilla' });
  });

  test('Sin cuenta también se puede reportar (usuario_id null)', async () => {
    const res = await enviarAvistamiento();
    expect(res.status).toBe(201);
    expect(Avistamiento.create.mock.calls[0][0].usuario_id).toBeNull();
  });

  test('Un token inválido no bloquea el reporte: se registra como anónimo', async () => {
    const res = await enviarAvistamiento('token-que-no-sirve');
    expect(res.status).toBe(201);
    expect(Avistamiento.create.mock.calls[0][0].usuario_id).toBeNull();
  });

  test('El aviso al dueño apunta al avistamiento (dónde la vieron), no solo al reporte', async () => {
    await enviarAvistamiento(token(TESTIGO));
    expect(Notificacion.create).toHaveBeenCalledWith(expect.objectContaining({
      usuario_id: 1, reporte_id: 30, avistamiento_id: 99, tipo: 'avistamiento',
    }));
  });

  test('El dueño no puede reportar un avistamiento de su propia mascota', async () => {
    const res = await enviarAvistamiento(token(DUENO));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/esta mascota es tuya/i);
    expect(Avistamiento.create).not.toHaveBeenCalled();
    expect(Notificacion.create).not.toHaveBeenCalled();
  });

  test('GET /avistamientos/mios devuelve solo los del usuario', async () => {
    Avistamiento.findAll.mockResolvedValue([{ id: 99 }]);
    const res = await request(app).get('/api/avistamientos/mios').set('Authorization', `Bearer ${token(TESTIGO)}`);
    expect(res.status).toBe(200);
    expect(res.body.avistamientos).toHaveLength(1);
    expect(Avistamiento.findAll.mock.calls[0][0].where).toEqual({ usuario_id: 2 });
  });

  test('GET /avistamientos/mios exige sesión', async () => {
    const res = await request(app).get('/api/avistamientos/mios');
    expect(res.status).toBe(401);
  });

  test('Las notificaciones incluyen la ubicación del avistamiento', async () => {
    Notificacion.findAll.mockResolvedValue([]);
    await request(app).get('/api/notificaciones').set('Authorization', `Bearer ${token(DUENO)}`);
    const include = Notificacion.findAll.mock.calls[0][0].include[0];
    expect(include.as).toBe('avistamiento');
    expect(include.attributes).toEqual(expect.arrayContaining(['latitud', 'longitud', 'foto_url']));
  });
});
