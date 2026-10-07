process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/app');
const { sign } = require('../../src/config/jwt');

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../src/models', () => ({
  Usuario: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Mascota: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
}));

jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

jest.mock('../../src/config/cloudinary', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/image.jpg' }),
  deleteImage: jest.fn().mockResolvedValue({}),
}));

const { Usuario, Mascota } = require('../../src/models');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TOKEN_USUARIO_1 = sign({ id: 1, rol: 'usuario', tokenVersion: 0 });

const mockUsuario1 = {
  id: 1, nombre: 'Ana García', email: 'ana@example.com',
  rol: 'usuario', token_version: 0, activo: true,
  toPublicJSON: jest.fn().mockReturnValue({ id: 1, nombre: 'Ana García' }),
};

const mockUsuario2 = {
  id: 2, nombre: 'Pedro López', email: 'pedro@example.com',
  rol: 'usuario', token_version: 0, activo: true,
  toPublicJSON: jest.fn().mockReturnValue({ id: 2, nombre: 'Pedro López' }),
};

function buildMockMascota(overrides = {}) {
  const base = {
    id: 1,
    usuario_id: 1,
    nombre: 'Firulais',
    especie: 'perro',
    raza: 'Labrador',
    edad: 3,
    edad_unidad: 'años',
    sexo: 'macho',
    color: 'Dorado',
    descripcion: 'Muy amigable',
    microchip: null,
    foto_urls: [],
    created_at: new Date(),
    update: jest.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
    save: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
    toPublicJSON: jest.fn().mockReturnValue({ id: 1, nombre: 'Firulais', especie: 'perro' }),
    ...overrides,
  };
  return base;
}

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('MascotaController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Auth middleware mock: por defecto usa usuario 1
    Usuario.findByPk.mockImplementation((id) => {
      if (id === 1) return Promise.resolve(mockUsuario1);
      if (id === 2) return Promise.resolve(mockUsuario2);
      return Promise.resolve(null);
    });
  });

  // ── POST /api/mascotas ─────────────────────────────────────────────────────
  describe('POST /api/mascotas', () => {
    test('201 con datos válidos', async () => {
      const mockMascota = buildMockMascota();
      Mascota.create.mockResolvedValue(mockMascota);

      const res = await request(app)
        .post('/api/mascotas')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`)
        .send({ nombre: 'Firulais', especie: 'perro', sexo: 'macho', color: 'Dorado' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.mascota).toBeDefined();
    });

    test('400 si falta el nombre', async () => {
      const res = await request(app)
        .post('/api/mascotas')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`)
        .send({ especie: 'perro', sexo: 'macho', color: 'Dorado' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('400 si falta la especie', async () => {
      const res = await request(app)
        .post('/api/mascotas')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`)
        .send({ nombre: 'Firulais', sexo: 'macho', color: 'Dorado' });

      expect(res.status).toBe(400);
    });

    test('401 sin token JWT', async () => {
      const res = await request(app)
        .post('/api/mascotas')
        .send({ nombre: 'Firulais', especie: 'perro', sexo: 'macho', color: 'Dorado' });

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/mascotas ──────────────────────────────────────────────────────
  describe('GET /api/mascotas', () => {
    test('retorna lista de mascotas del usuario autenticado', async () => {
      const mascotas = [buildMockMascota(), buildMockMascota({ id: 2, nombre: 'Luna' })];
      Mascota.findAll.mockResolvedValue(mascotas);

      const res = await request(app)
        .get('/api/mascotas')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mascotas)).toBe(true);
      expect(res.body.mascotas).toHaveLength(2);
    });

    test('retorna lista vacía si el usuario no tiene mascotas', async () => {
      Mascota.findAll.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/mascotas')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`);

      expect(res.status).toBe(200);
      expect(res.body.mascotas).toHaveLength(0);
    });
  });

  // ── PUT /api/mascotas/:id ──────────────────────────────────────────────────
  describe('PUT /api/mascotas/:id', () => {
    test('200 actualiza datos de la mascota', async () => {
      const mockMascota = buildMockMascota({ usuario_id: 1 });
      Mascota.findOne.mockResolvedValue(mockMascota);

      const res = await request(app)
        .put('/api/mascotas/1')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`)
        .send({ nombre: 'Firulais Actualizado', especie: 'perro', sexo: 'macho', color: 'Negro' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('403 si la mascota pertenece a otro usuario', async () => {
      // La mascota es del usuario 2
      const mockMascota = buildMockMascota({ usuario_id: 2 });
      Mascota.findOne.mockResolvedValue(mockMascota);

      // Pero el token es del usuario 1
      const res = await request(app)
        .put('/api/mascotas/1')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`)
        .send({ nombre: 'Intento', especie: 'perro', sexo: 'macho', color: 'Negro' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/mascotas/:id/fotos ───────────────────────────────────────────
  describe('POST /api/mascotas/:id/fotos', () => {
    test('Máximo 5 fotos por mascota — rechaza la 6ta', async () => {
      const mockMascota = buildMockMascota({
        usuario_id: 1,
        foto_urls: ['url1', 'url2', 'url3', 'url4', 'url5'],
      });
      Mascota.findOne.mockResolvedValue(mockMascota);

      const res = await request(app)
        .post('/api/mascotas/1/fotos')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`)
        .attach('fotos', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/5 fotos/i);
    });

    test('200 sube fotos correctamente cuando hay espacio disponible', async () => {
      const mockMascota = buildMockMascota({ usuario_id: 1, foto_urls: [] });
      Mascota.findOne.mockResolvedValue(mockMascota);

      const res = await request(app)
        .post('/api/mascotas/1/fotos')
        .set('Authorization', `Bearer ${TOKEN_USUARIO_1}`)
        .attach('fotos', Buffer.from('fake-image-data'), {
          filename: 'perro.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.foto_urls).toBeDefined();
    });
  });

  // ── Validación de formato de archivo ──────────────────────────────────────
  describe('Validación de archivos', () => {
    test('Solo acepta formatos JPG y PNG — fileFilter aprueba JPG', () => {
      const { fileFilter } = require('../../src/middlewares/uploadMiddleware');
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('Solo acepta formatos JPG y PNG — fileFilter aprueba PNG', () => {
      const { fileFilter } = require('../../src/middlewares/uploadMiddleware');
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('Solo acepta formatos JPG y PNG — fileFilter rechaza WebP', () => {
      const { fileFilter } = require('../../src/middlewares/uploadMiddleware');
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/webp' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });

    test('Solo acepta formatos JPG y PNG — fileFilter rechaza GIF', () => {
      const { fileFilter } = require('../../src/middlewares/uploadMiddleware');
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/gif' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});
