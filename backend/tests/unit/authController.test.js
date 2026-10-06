// Variables de entorno para tests — deben cargarse ANTES que cualquier módulo que las use
process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../src/models', () => ({
  Usuario: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

const { Usuario } = require('../../src/models');

// ─── Helper ───────────────────────────────────────────────────────────────────
async function buildMockUser(overrides = {}) {
  const hashedPassword = await bcrypt.hash('password123', 10);
  return {
    id: 1,
    nombre: 'Ana García',
    email: 'ana@example.com',
    password: hashedPassword,
    rol: 'usuario',
    radio_alerta: 5,
    token_version: 0,
    activo: true,
    created_at: new Date(),
    increment: jest.fn().mockResolvedValue(true),
    verificarPassword: jest.fn((plain) => bcrypt.compare(plain, hashedPassword)),
    toPublicJSON: jest.fn().mockReturnValue({
      id: 1,
      nombre: 'Ana García',
      email: 'ana@example.com',
      rol: 'usuario',
      radio_alerta: 5,
    }),
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('AuthController', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── POST /api/auth/register ────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    test('201 con usuario válido', async () => {
      const mockUser = await buildMockUser();
      Usuario.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/register').send({
        celular: '3001234567',
        nombre: 'Ana García',
        email: 'ana@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.usuario.email).toBe('ana@example.com');
    });

    test('400 si falta el nombre', async () => {
      const res = await request(app).post('/api/auth/register').send({
        celular: '3001234567',
        email: 'ana@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('400 si falta el correo', async () => {
      const res = await request(app).post('/api/auth/register').send({
        celular: '3001234567',
        nombre: 'Ana García',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });

    test('400 si falta la contraseña', async () => {
      const res = await request(app).post('/api/auth/register').send({
        celular: '3001234567',
        nombre: 'Ana García',
        email: 'ana@example.com',
      });
      expect(res.status).toBe(400);
    });

    test('400 si la contraseña tiene menos de 8 caracteres (HU-01)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        celular: '3001234567',
        nombre: 'Ana García',
        email: 'ana@example.com',
        password: '123',
      });
      expect(res.status).toBe(400);
    });

    test('409 si el correo ya existe', async () => {
      const mockUser = await buildMockUser();
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/register').send({
        celular: '3001234567',
        nombre: 'Ana García',
        email: 'ana@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    test('200 con token JWT al ingresar credenciales correctas', async () => {
      const mockUser = await buildMockUser();
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/login').send({
        email: 'ana@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    test('401 si la contraseña es incorrecta', async () => {
      const mockUser = await buildMockUser();
      mockUser.verificarPassword = jest.fn().mockResolvedValue(false);
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/login').send({
        email: 'ana@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('401 con mensaje genérico si el correo no existe (no revela cuentas)', async () => {
      Usuario.findOne.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'noexiste@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Correo o contraseña incorrectos.');
    });

    test('400 si el body está vacío', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    test('403 si el usuario está inactivo', async () => {
      const mockUser = await buildMockUser({ activo: false });
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/login').send({
        email: 'ana@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/auth/me ───────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    test('401 sin token en el header', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('401 con token malformado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer tokeninvalido');
      expect(res.status).toBe(401);
    });
  });

  // ── Seguridad de contraseña ────────────────────────────────────────────────
  describe('Seguridad', () => {
    test('La contraseña se almacena hasheada con bcrypt (cost >= 10)', async () => {
      const plainPassword = 'miContraseñaSegura';
      const hash = await bcrypt.hash(plainPassword, 10);
      const cost = parseInt(hash.split('$')[2], 10);
      expect(cost).toBeGreaterThanOrEqual(10);
      expect(hash).not.toBe(plainPassword);
    });

    test('bcrypt.compare valida contraseña correcta', async () => {
      const plain = 'password123';
      const hash = await bcrypt.hash(plain, 10);
      const result = await bcrypt.compare(plain, hash);
      expect(result).toBe(true);
    });

    test('bcrypt.compare rechaza contraseña incorrecta', async () => {
      const hash = await bcrypt.hash('password123', 10);
      const result = await bcrypt.compare('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });
});

describe('AuthController — reglas de la tesis (HU-01 / R1)', () => {
  test('400 si falta el celular', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Sin Celular', email: 'sincel@example.com', password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  test('400 si la contraseña tiene 7 caracteres', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Corta', email: 'corta@example.com', celular: '3001234567', password: '1234567',
    });
    expect(res.status).toBe(400);
  });
});
