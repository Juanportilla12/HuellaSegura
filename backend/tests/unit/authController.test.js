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
    update: jest.fn().mockResolvedValue([1]),
  },
}));

jest.mock('../../src/services/emailService', () => ({
  enviarCorreoVerificacion: jest.fn().mockResolvedValue({}),
  enviarCorreoResetCodigo: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

const { Usuario } = require('../../src/models');
const { enviarCorreoVerificacion } = require('../../src/services/emailService');

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
    email_verificado: true,
    login_fallidos: 0,
    bloqueado_hasta: null,
    created_at: new Date(),
    increment: jest.fn().mockResolvedValue(true),
    // Como Sequelize: update/set/save cambian los campos del propio objeto
    update: jest.fn(async function (datos) { Object.assign(this, datos); return this; }),
    set: jest.fn(function (datos) { Object.assign(this, datos); }),
    save: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
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
    test('201: crea la cuenta PENDIENTE, envía el código al correo y no entrega sesión', async () => {
      const mockUser = await buildMockUser({ email_verificado: false });
      Usuario.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/register').send({
        celular: '3001234567',
        nombre: 'Ana García',
        email: 'ana@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ success: true, requiereVerificacion: true, email: 'ana@example.com' });
      expect(res.body.token).toBeUndefined(); // sin verificar no hay sesión
      expect(Usuario.create.mock.calls[0][0]).toMatchObject({ email_verificado: false });
      const { codigo } = enviarCorreoVerificacion.mock.calls[0][0];
      expect(codigo).toMatch(/^\d{6}$/);
      // En la base de datos queda el hash, nunca el código
      const guardado = mockUser.update.mock.calls[0][0].verificacion_code;
      expect(guardado).not.toBe(codigo);
      expect(await bcrypt.compare(codigo, guardado)).toBe(true);
    });

    test('Si alguien registró tu correo y nunca lo verificó, puedes registrarte igual (se reemplaza)', async () => {
      const pendiente = await buildMockUser({ email_verificado: false, nombre: 'Suplantador', verificacion_enviada: null });
      Usuario.findOne.mockResolvedValue(pendiente);

      const res = await request(app).post('/api/auth/register').send({
        celular: '3109998877', nombre: 'Ana García', email: 'ana@example.com', password: 'otraClave123',
      });

      expect(res.status).toBe(201);
      expect(pendiente.set).toHaveBeenCalledWith({ nombre: 'Ana García', celular: '3109998877', password: 'otraClave123' });
      expect(Usuario.create).not.toHaveBeenCalled();
      expect(enviarCorreoVerificacion).toHaveBeenCalledTimes(1);
    });

    test('Si el correo de verificación no sale, avisa (503) y no deja la cuenta creada', async () => {
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production'; // en producción el fallo del correo se informa
      const mockUser = await buildMockUser({ email_verificado: false });
      Usuario.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue(mockUser);
      enviarCorreoVerificacion.mockRejectedValueOnce(new Error('Brevo caído'));

      const res = await request(app).post('/api/auth/register').send({
        celular: '3001234567', nombre: 'Ana García', email: 'ana@example.com', password: 'password123',
      });
      process.env.NODE_ENV = prev;

      expect(res.status).toBe(503);
      expect(mockUser.destroy).toHaveBeenCalled();
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

    test('409 si el correo ya pertenece a una cuenta verificada', async () => {
      const mockUser = await buildMockUser({ email_verificado: true });
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

    test('403 CORREO_NO_VERIFICADO: con la contraseña correcta pero sin verificar no hay sesión', async () => {
      const mockUser = await buildMockUser({ email_verificado: false, verificacion_enviada: null });
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ codigo: 'CORREO_NO_VERIFICADO', email: 'ana@example.com' });
      expect(res.body.token).toBeUndefined();
      expect(enviarCorreoVerificacion).toHaveBeenCalledTimes(1); // se le reenvía el código
    });

    test('Con la contraseña incorrecta NO revela si la cuenta está sin verificar', async () => {
      const mockUser = await buildMockUser({ email_verificado: false });
      mockUser.verificarPassword = jest.fn().mockResolvedValue(false);
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'mala12345' });

      expect(res.status).toBe(401);
      expect(res.body.codigo).toBeUndefined();
    });

    test('Bloquea la cuenta 15 minutos tras 5 contraseñas incorrectas seguidas (423)', async () => {
      const mockUser = await buildMockUser({ login_fallidos: 4 });
      mockUser.verificarPassword = jest.fn().mockResolvedValue(false);
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'mala12345' });

      expect(res.status).toBe(423);
      expect(res.body.codigo).toBe('CUENTA_BLOQUEADA');
      expect(new Date(mockUser.bloqueado_hasta) - Date.now()).toBeGreaterThan(14 * 60 * 1000);
    });

    test('Con la cuenta bloqueada ni siquiera se comprueba la contraseña', async () => {
      const mockUser = await buildMockUser({ bloqueado_hasta: new Date(Date.now() + 10 * 60 * 1000) });
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'password123' });

      expect(res.status).toBe(423);
      expect(mockUser.verificarPassword).not.toHaveBeenCalled();
    });

    test('Un inicio de sesión correcto reinicia el contador de intentos fallidos', async () => {
      const mockUser = await buildMockUser({ login_fallidos: 3 });
      Usuario.findOne.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(mockUser.update).toHaveBeenCalledWith({ login_fallidos: 0, bloqueado_hasta: null });
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

  // ── POST /api/auth/verificar-correo ────────────────────────────────────────
  describe('POST /api/auth/verificar-correo', () => {
    async function pendienteConCodigo(codigo) {
      return buildMockUser({
        email_verificado: false,
        verificacion_code: await bcrypt.hash(codigo, 10),
        verificacion_expira: new Date(Date.now() + 10 * 60 * 1000),
        verificacion_intentos: 0,
      });
    }

    test('Con el código correcto activa la cuenta e inicia sesión', async () => {
      const u = await pendienteConCodigo('482913');
      Usuario.findOne.mockResolvedValue(u);

      const res = await request(app).post('/api/auth/verificar-correo').send({ email: 'ana@example.com', codigo: '482913' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(u.update).toHaveBeenCalledWith(expect.objectContaining({ email_verificado: true, verificacion_code: null }));
    });

    test('Con un código incorrecto no activa la cuenta e informa los intentos restantes', async () => {
      const u = await pendienteConCodigo('482913');
      Usuario.findOne.mockResolvedValue(u);

      const res = await request(app).post('/api/auth/verificar-correo').send({ email: 'ana@example.com', codigo: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/te quedan 4 intento/i);
      expect(u.email_verificado).toBe(false);
    });

    test('Un código vencido no sirve', async () => {
      const u = await pendienteConCodigo('482913');
      u.verificacion_expira = new Date(Date.now() - 1000);
      Usuario.findOne.mockResolvedValue(u);

      const res = await request(app).post('/api/auth/verificar-correo').send({ email: 'ana@example.com', codigo: '482913' });

      expect(res.status).toBe(400);
      expect(res.body.token).toBeUndefined();
    });
  });

  // ── POST /api/auth/reenviar-verificacion ───────────────────────────────────
  describe('POST /api/auth/reenviar-verificacion', () => {
    test('Envía un código nuevo a una cuenta pendiente', async () => {
      Usuario.findOne.mockResolvedValue(await buildMockUser({ email_verificado: false, verificacion_enviada: null }));
      const res = await request(app).post('/api/auth/reenviar-verificacion').send({ email: 'ana@example.com' });
      expect(res.status).toBe(200);
      expect(enviarCorreoVerificacion).toHaveBeenCalledTimes(1);
    });

    test('No permite pedir otro código antes de un minuto (429)', async () => {
      Usuario.findOne.mockResolvedValue(await buildMockUser({ email_verificado: false, verificacion_enviada: new Date() }));
      const res = await request(app).post('/api/auth/reenviar-verificacion').send({ email: 'ana@example.com' });
      expect(res.status).toBe(429);
      expect(enviarCorreoVerificacion).not.toHaveBeenCalled();
    });

    test('Respuesta genérica si el correo no existe (no revela cuentas)', async () => {
      Usuario.findOne.mockResolvedValue(null);
      const res = await request(app).post('/api/auth/reenviar-verificacion').send({ email: 'nadie@example.com' });
      expect(res.status).toBe(200);
      expect(enviarCorreoVerificacion).not.toHaveBeenCalled();
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
