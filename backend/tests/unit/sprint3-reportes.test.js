/**
 * Sprint 3 — Definition of Done
 * Reportes de mascotas perdidas
 */
process.env.JWT_SECRET     = 'test_secret_huella_segura_2026';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV       = 'test';

const request  = require('supertest');
const app      = require('../../src/app');
const { sign } = require('../../src/config/jwt');

jest.mock('../../src/models', () => ({
  Usuario:      { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Mascota:      { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  Reporte:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Notificacion: { bulkCreate: jest.fn().mockResolvedValue([]) },
}));
jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({ sendMail: jest.fn().mockResolvedValue(true) }),
}));

const { Usuario, Mascota, Reporte } = require('../../src/models');

const TOKEN_U1 = sign({ id: 1, rol: 'usuario', tokenVersion: 0 });

const mockUsuario1 = {
  id: 1, nombre: 'Ana', email: 'ana@test.com',
  rol: 'usuario', token_version: 0, activo: true, radio_alerta: 5,
  toPublicJSON: jest.fn().mockReturnValue({ id: 1 }),
};
const mockUsuario2 = {
  id: 2, nombre: 'Pedro', email: 'pedro@test.com',
  rol: 'usuario', token_version: 0, activo: true, radio_alerta: 5,
  toPublicJSON: jest.fn().mockReturnValue({ id: 2 }),
};

function buildMascota(o = {}) {
  return { id: 1, usuario_id: 1, nombre: 'Max', especie: 'perro', foto_urls: [], ...o };
}

function buildReporte(o = {}) {
  return {
    id: 1, mascota_id: 1, usuario_id: 1,
    latitud: 1.2136, longitud: -77.2811,
    fecha_perdida: '2026-04-20', estado: 'en_busqueda', moderado: false,
    mascota: { nombre: 'Max', especie: 'perro', foto_urls: [] },
    update: jest.fn().mockImplementation(function (d) { Object.assign(this, d); return Promise.resolve(this); }),
    toPublicJSON: jest.fn().mockReturnValue({ id: 1, estado: o.estado || 'en_busqueda' }),
    ...o,
  };
}

describe('Sprint 3 — Reportes de mascotas perdidas (DoD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Usuario.findByPk.mockImplementation(id => {
      if (id === 1) return Promise.resolve(mockUsuario1);
      if (id === 2) return Promise.resolve(mockUsuario2);
      return Promise.resolve(null);
    });
  });

  const PAYLOAD = {
    mascota_id: 1, latitud: 1.2136, longitud: -77.2811,
    fecha_perdida: '2026-04-20', descripcion: 'Se perdió en el parque',
  };

  // ── Criterio 1: Crear reporte seleccionando mascota registrada ─────────────
  test('C1 — Crea reporte con mascota registrada → 201', async () => {
    Mascota.findOne.mockResolvedValue(buildMascota({ usuario_id: 1 }));
    Reporte.create.mockResolvedValue(buildReporte());
    const res = await request(app)
      .post('/api/reportes')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send(PAYLOAD);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.reporte).toBeDefined();
  });

  test('C1 — Rechaza si la mascota es de otro usuario → 403', async () => {
    Mascota.findOne.mockResolvedValue(buildMascota({ usuario_id: 2 }));
    const res = await request(app)
      .post('/api/reportes')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send(PAYLOAD);
    expect(res.status).toBe(403);
  });

  test('C1 — Requiere autenticación → 401 sin token', async () => {
    const res = await request(app).post('/api/reportes').send(PAYLOAD);
    expect(res.status).toBe(401);
  });

  // ── Criterio 2: Captura automática de coordenadas GPS ────────────────────
  test('C2 — Almacena latitud y longitud del reporte → 400 sin latitud', async () => {
    const res = await request(app)
      .post('/api/reportes')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send({ mascota_id: 1, longitud: -77.2811, fecha_perdida: '2026-04-20' });
    expect(res.status).toBe(400);
  });

  test('C2 — Almacena latitud y longitud del reporte → 400 sin longitud', async () => {
    const res = await request(app)
      .post('/api/reportes')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send({ mascota_id: 1, latitud: 1.2136, fecha_perdida: '2026-04-20' });
    expect(res.status).toBe(400);
  });

  test('C2 — create recibe las coordenadas correctas', async () => {
    Mascota.findOne.mockResolvedValue(buildMascota({ usuario_id: 1 }));
    Reporte.create.mockResolvedValue(buildReporte());
    await request(app)
      .post('/api/reportes')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send(PAYLOAD);
    expect(Reporte.create).toHaveBeenCalledWith(
      expect.objectContaining({ latitud: 1.2136, longitud: -77.2811 })
    );
  });

  // ── Criterio 3: Reporte visible en mapa ───────────────────────────────────
  test('C3 — GET /api/reportes retorna reportes activos (sin token)', async () => {
    Reporte.findAll.mockResolvedValue([buildReporte(), buildReporte({ id: 2 })]);
    const res = await request(app).get('/api/reportes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reportes)).toBe(true);
  });

  test('C3 — findAll filtra solo estado "en_busqueda"', async () => {
    Reporte.findAll.mockResolvedValue([buildReporte()]);
    await request(app).get('/api/reportes');
    expect(Reporte.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estado: 'en_busqueda' }),
      })
    );
  });

  // ── Criterios 4 y 5: Cambiar estado del reporte ───────────────────────────
  test('C4/C5 — Cambia estado a "encontrada" → 200', async () => {
    Reporte.findByPk.mockResolvedValue(buildReporte({ usuario_id: 1 }));
    const res = await request(app)
      .put('/api/reportes/1/estado')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send({ estado: 'encontrada' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('C4/C5 — Cambia estado a "cerrado" → 200', async () => {
    Reporte.findByPk.mockResolvedValue(buildReporte({ usuario_id: 1 }));
    const res = await request(app)
      .put('/api/reportes/1/estado')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send({ estado: 'cerrado' });
    expect(res.status).toBe(200);
  });

  test('C4/C5 — Estado inválido rechazado → 400', async () => {
    const res = await request(app)
      .put('/api/reportes/1/estado')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send({ estado: 'inexistente' });
    expect(res.status).toBe(400);
  });

  test('C4/C5 — No puede cambiar reporte de otro usuario → 403', async () => {
    Reporte.findByPk.mockResolvedValue(buildReporte({ usuario_id: 2 }));
    const res = await request(app)
      .put('/api/reportes/1/estado')
      .set('Authorization', `Bearer ${TOKEN_U1}`)
      .send({ estado: 'encontrada' });
    expect(res.status).toBe(403);
  });

  // ── Criterio 6: Listado del usuario con estado y fecha ────────────────────
  test('C6 — Mis reportes retorna array con estado y fecha → 200', async () => {
    Reporte.findAll.mockResolvedValue([buildReporte(), buildReporte({ id: 2 })]);
    const res = await request(app)
      .get('/api/reportes/mis-reportes')
      .set('Authorization', `Bearer ${TOKEN_U1}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reportes).toHaveLength(2);
  });

  test('C6 — Mis reportes requiere token → 401', async () => {
    const res = await request(app).get('/api/reportes/mis-reportes');
    expect(res.status).toBe(401);
  });
});
