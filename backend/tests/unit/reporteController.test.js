process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/app');
const { sign } = require('../../src/config/jwt');

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../src/models', () => ({
  Usuario:  { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Mascota:  { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  Reporte:  { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
}));

jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

const { Usuario, Mascota, Reporte } = require('../../src/models');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TOKEN_U1 = sign({ id: 1, rol: 'usuario', tokenVersion: 0 });

const mockUsuario1 = {
  id: 1, nombre: 'Ana García', email: 'ana@example.com',
  rol: 'usuario', token_version: 0, activo: true,
  toPublicJSON: jest.fn().mockReturnValue({ id: 1 }),
};
const mockUsuario2 = {
  id: 2, nombre: 'Pedro López', email: 'pedro@example.com',
  rol: 'usuario', token_version: 0, activo: true,
  toPublicJSON: jest.fn().mockReturnValue({ id: 2 }),
};

function buildMockMascota(overrides = {}) {
  return { id: 1, usuario_id: 1, nombre: 'Firulais', especie: 'perro', foto_urls: [], ...overrides };
}

function buildMockReporte(overrides = {}) {
  return {
    id: 1,
    mascota_id: 1,
    usuario_id: 1,
    latitud: 1.2136,
    longitud: -77.2811,
    descripcion: 'Se perdió en el parque',
    estado: 'en_busqueda',
    fecha_perdida: '2026-04-20',
    created_at: new Date(),
    update: jest.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
    toPublicJSON: jest.fn().mockReturnValue({ id: 1, estado: overrides.estado || 'en_busqueda' }),
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('ReporteController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Usuario.findByPk.mockImplementation((id) => {
      if (id === 1) return Promise.resolve(mockUsuario1);
      if (id === 2) return Promise.resolve(mockUsuario2);
      return Promise.resolve(null);
    });
  });

  const PAYLOAD_VALIDO = {
    mascota_id: 1,
    latitud: 1.2136,
    longitud: -77.2811,
    fecha_perdida: '2026-04-20',
    descripcion: 'Se perdió en el parque Infantil',
  };

  // ── POST /api/reportes ─────────────────────────────────────────────────────
  describe('POST /api/reportes', () => {
    test('201 con mascota existente y coordenadas válidas', async () => {
      Mascota.findOne.mockResolvedValue(buildMockMascota({ usuario_id: 1 }));
      Reporte.create.mockResolvedValue(buildMockReporte());

      const res = await request(app)
        .post('/api/reportes')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send(PAYLOAD_VALIDO);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.reporte).toBeDefined();
    });

    test('400 sin coordenadas GPS — falta latitud', async () => {
      const res = await request(app)
        .post('/api/reportes')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send({ mascota_id: 1, longitud: -77.2811, fecha_perdida: '2026-04-20' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('400 sin coordenadas GPS — falta longitud', async () => {
      const res = await request(app)
        .post('/api/reportes')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send({ mascota_id: 1, latitud: 1.2136, fecha_perdida: '2026-04-20' });

      expect(res.status).toBe(400);
    });

    test('400 sin fecha de pérdida', async () => {
      const res = await request(app)
        .post('/api/reportes')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send({ mascota_id: 1, latitud: 1.2136, longitud: -77.2811 });

      expect(res.status).toBe(400);
    });

    test('403 si la mascota no pertenece al usuario', async () => {
      // La mascota pertenece al usuario 2
      Mascota.findOne.mockResolvedValue(buildMockMascota({ usuario_id: 2 }));

      const res = await request(app)
        .post('/api/reportes')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send(PAYLOAD_VALIDO);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('401 sin token JWT', async () => {
      const res = await request(app).post('/api/reportes').send(PAYLOAD_VALIDO);
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/reportes ──────────────────────────────────────────────────────
  describe('GET /api/reportes', () => {
    test('retorna solo reportes con estado "en_busqueda"', async () => {
      const reportesActivos = [
        buildMockReporte({ estado: 'en_busqueda' }),
        buildMockReporte({ id: 2, estado: 'en_busqueda' }),
      ];
      Reporte.findAll.mockResolvedValue(reportesActivos);

      const res = await request(app).get('/api/reportes');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.reportes)).toBe(true);
      // Verificar que el findAll se llamó con filtro de estado
      expect(Reporte.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'en_busqueda' }),
        })
      );
    });

    test('es accesible sin token JWT (ruta pública)', async () => {
      Reporte.findAll.mockResolvedValue([]);
      const res = await request(app).get('/api/reportes');
      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/reportes/mis-reportes ────────────────────────────────────────
  describe('GET /api/reportes/mis-reportes', () => {
    test('retorna reportes del usuario autenticado', async () => {
      Reporte.findAll.mockResolvedValue([buildMockReporte(), buildMockReporte({ id: 2 })]);

      const res = await request(app)
        .get('/api/reportes/mis-reportes')
        .set('Authorization', `Bearer ${TOKEN_U1}`);

      expect(res.status).toBe(200);
      expect(res.body.reportes).toHaveLength(2);
    });

    test('401 sin token JWT', async () => {
      const res = await request(app).get('/api/reportes/mis-reportes');
      expect(res.status).toBe(401);
    });
  });

  // ── PUT /api/reportes/:id/estado ───────────────────────────────────────────
  describe('PUT /api/reportes/:id/estado', () => {
    test('200 cambia estado a "encontrada" correctamente', async () => {
      const mockReporte = buildMockReporte({ usuario_id: 1, estado: 'en_busqueda' });
      Reporte.findByPk.mockResolvedValue(mockReporte);

      const res = await request(app)
        .put('/api/reportes/1/estado')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send({ estado: 'encontrada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('200 cambia estado a "cerrado" correctamente', async () => {
      const mockReporte = buildMockReporte({ usuario_id: 1 });
      Reporte.findByPk.mockResolvedValue(mockReporte);

      const res = await request(app)
        .put('/api/reportes/1/estado')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send({ estado: 'cerrado' });

      expect(res.status).toBe(200);
    });

    test('400 estado inválido es rechazado', async () => {
      const res = await request(app)
        .put('/api/reportes/1/estado')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send({ estado: 'inexistente' });

      expect(res.status).toBe(400);
    });

    test('valores válidos de estado: en_busqueda, encontrada, cerrado', async () => {
      const ESTADOS = ['en_busqueda', 'encontrada', 'cerrado'];

      for (const estado of ESTADOS) {
        const mockReporte = buildMockReporte({ usuario_id: 1 });
        Reporte.findByPk.mockResolvedValue(mockReporte);

        const res = await request(app)
          .put('/api/reportes/1/estado')
          .set('Authorization', `Bearer ${TOKEN_U1}`)
          .send({ estado });

        expect(res.status).toBe(200);
      }
    });

    test('403 si el reporte pertenece a otro usuario', async () => {
      const mockReporte = buildMockReporte({ usuario_id: 2 });
      Reporte.findByPk.mockResolvedValue(mockReporte);

      const res = await request(app)
        .put('/api/reportes/1/estado')
        .set('Authorization', `Bearer ${TOKEN_U1}`)
        .send({ estado: 'encontrada' });

      expect(res.status).toBe(403);
    });
  });
});
