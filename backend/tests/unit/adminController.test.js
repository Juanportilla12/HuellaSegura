process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/app');
const { sign } = require('../../src/config/jwt');

jest.mock('../../src/models', () => ({
  Usuario:      { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn(), count: jest.fn() },
  Mascota:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Reporte:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() },
  Notificacion: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), bulkCreate: jest.fn() },
  Avistamiento: { create: jest.fn(), count: jest.fn() },
  EntidadAliada:{ findAll: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
}));

jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

const { Usuario, Reporte, Avistamiento } = require('../../src/models');

const TOKEN_ADMIN  = sign({ id: 1, rol: 'admin',  tokenVersion: 0 });
const TOKEN_USUARIO = sign({ id: 2, rol: 'usuario', tokenVersion: 0 });

const mockAdmin = {
  id: 1, nombre: 'Admin', email: 'admin@huellasegura.co',
  rol: 'admin', token_version: 0, activo: true,
  toPublicJSON: jest.fn().mockReturnValue({ id: 1 }),
};
const mockUsuario = {
  id: 2, nombre: 'Ana', email: 'ana@example.com',
  rol: 'usuario', token_version: 0, activo: true,
  toPublicJSON: jest.fn().mockReturnValue({ id: 2 }),
};

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('adminMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Permite acceso a usuarios con rol admin', async () => {
    Usuario.findByPk.mockResolvedValue(mockAdmin);
    Usuario.count.mockResolvedValue(10);
    Reporte.count.mockResolvedValue(5);
    Avistamiento.count.mockResolvedValue(3);

    const res = await request(app)
      .get('/api/admin/estadisticas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(res.status).toBe(200);
  });

  test('Rechaza con 403 a usuarios sin rol admin', async () => {
    Usuario.findByPk.mockResolvedValue(mockUsuario);

    const res = await request(app)
      .get('/api/admin/estadisticas')
      .set('Authorization', `Bearer ${TOKEN_USUARIO}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Rechaza con 401 sin token', async () => {
    const res = await request(app).get('/api/admin/estadisticas');
    expect(res.status).toBe(401);
  });
});

describe('adminController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Usuario.findByPk.mockResolvedValue(mockAdmin);
  });

  test('GET /admin/estadisticas → retorna conteos correctos', async () => {
    Usuario.count.mockResolvedValue(25);
    Reporte.count.mockResolvedValueOnce(8).mockResolvedValueOnce(40).mockResolvedValueOnce(12);
    Avistamiento.count.mockResolvedValue(6);

    const res = await request(app)
      .get('/api/admin/estadisticas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.estadisticas).toHaveProperty('total_usuarios');
    expect(res.body.estadisticas).toHaveProperty('reportes_activos');
    expect(res.body.estadisticas).toHaveProperty('avistamientos_mes');
    expect(res.body.estadisticas.total_usuarios).toBe(25);
  });

  test('PUT /admin/usuarios/:id/estado → activa/desactiva usuario', async () => {
    const mockTarget = {
      id: 5, nombre: 'Pedro', activo: true,
      update: jest.fn().mockImplementation(function(data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      }),
    };
    Usuario.findByPk
      .mockResolvedValueOnce(mockAdmin)   // auth middleware
      .mockResolvedValueOnce(mockTarget); // controller

    const res = await request(app)
      .put('/api/admin/usuarios/5/estado')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockTarget.update).toHaveBeenCalledWith({ activo: false });
  });

  test('PUT /admin/reportes/:id/moderar → oculta el reporte', async () => {
    const mockReporte = {
      id: 3, moderado: false,
      update: jest.fn().mockResolvedValue({ id: 3, moderado: true }),
    };
    Reporte.findByPk.mockResolvedValue(mockReporte);

    const res = await request(app)
      .put('/api/admin/reportes/3/moderar')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.moderado).toBe(true);
    expect(mockReporte.update).toHaveBeenCalledWith({ moderado: true });
  });

  test('PUT /admin/reportes/:id/moderar sobre un reporte oculto → lo vuelve a mostrar', async () => {
    const mockReporte = { id: 3, moderado: true, update: jest.fn().mockResolvedValue({}) };
    Reporte.findByPk.mockResolvedValue(mockReporte);

    const res = await request(app)
      .put('/api/admin/reportes/3/moderar')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.moderado).toBe(false);
    expect(mockReporte.update).toHaveBeenCalledWith({ moderado: false });
  });

  test('GET /admin/reportes incluye la mascota y quién lo publicó', async () => {
    Reporte.findAll.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/reportes')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);

    expect(res.status).toBe(200);
    const { include } = Reporte.findAll.mock.calls[0][0];
    expect(include.map((i) => i.as)).toEqual(['mascota', 'reportante']);
  });

  test('401 si intenta moderar sin token', async () => {
    const res = await request(app).put('/api/admin/reportes/3/moderar');
    expect(res.status).toBe(401);
  });
});
