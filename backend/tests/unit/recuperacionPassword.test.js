process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../../src/models', () => ({
  Usuario: { findOne: jest.fn(), findByPk: jest.fn() },
  Mascota: {}, Reporte: {}, Notificacion: {}, Avistamiento: {}, EntidadAliada: {},
}));
jest.mock('../../src/config/connection', () => ({ authenticate: jest.fn(), define: jest.fn() }));
jest.mock('../../src/services/emailService', () => ({
  enviarCorreoResetCodigo: jest.fn().mockResolvedValue({}),
}));

const app = require('../../src/app');
const { Usuario } = require('../../src/models');
const { enviarCorreoResetCodigo } = require('../../src/services/emailService');

function crearUsuario(datos = {}) {
  const u = {
    id: 1, nombre: 'Ana', email: 'ana@example.com', token_version: 3,
    reset_code: null, reset_code_expires: null, reset_intentos: 0,
    update: jest.fn(async (cambios) => Object.assign(u, cambios)),
    ...datos,
  };
  return u;
}

async function usuarioConCodigo(codigo, extra = {}) {
  return crearUsuario({
    reset_code: await bcrypt.hash(codigo, 4),
    reset_code_expires: new Date(Date.now() + 10 * 60 * 1000),
    ...extra,
  });
}

beforeEach(() => jest.clearAllMocks());

describe('Recuperación de contraseña', () => {
  test('El código se guarda cifrado, nunca en texto plano', async () => {
    const u = crearUsuario();
    Usuario.findOne.mockResolvedValue(u);
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ana@example.com' });
    expect(res.status).toBe(200);

    const codigoEnviado = enviarCorreoResetCodigo.mock.calls[0][0].codigo;
    const guardado = u.update.mock.calls[0][0].reset_code;
    expect(guardado).not.toBe(codigoEnviado);
    expect(await bcrypt.compare(codigoEnviado, guardado)).toBe(true);
    expect(u.update.mock.calls[0][0].reset_intentos).toBe(0);
  });

  test('Correo inexistente → misma respuesta genérica', async () => {
    Usuario.findOne.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nadie@example.com' });
    expect(res.status).toBe(200);
    expect(enviarCorreoResetCodigo).not.toHaveBeenCalled();
  });

  test('Código correcto se verifica', async () => {
    Usuario.findOne.mockResolvedValue(await usuarioConCodigo('123456'));
    const res = await request(app).post('/api/auth/verify-reset-code').send({ email: 'ana@example.com', codigo: '123456' });
    expect(res.status).toBe(200);
  });

  test('Código incorrecto suma un intento e informa los restantes', async () => {
    const u = await usuarioConCodigo('123456');
    Usuario.findOne.mockResolvedValue(u);
    const res = await request(app).post('/api/auth/verify-reset-code').send({ email: 'ana@example.com', codigo: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/quedan 4/);
    expect(u.reset_intentos).toBe(1);
  });

  test('Al quinto intento fallido el código se invalida (429)', async () => {
    const u = await usuarioConCodigo('123456', { reset_intentos: 4 });
    Usuario.findOne.mockResolvedValue(u);
    const res = await request(app).post('/api/auth/verify-reset-code').send({ email: 'ana@example.com', codigo: '000000' });
    expect(res.status).toBe(429);
    expect(u.reset_code).toBeNull();
  });

  test('Tras invalidarse, ni el código correcto sirve', async () => {
    const u = await usuarioConCodigo('123456', { reset_intentos: 5 });
    Usuario.findOne.mockResolvedValue(u);
    const res = await request(app).post('/api/auth/verify-reset-code').send({ email: 'ana@example.com', codigo: '123456' });
    expect(res.status).toBe(429);
  });

  test('Código expirado → 400', async () => {
    const u = await usuarioConCodigo('123456', { reset_code_expires: new Date(Date.now() - 1000) });
    Usuario.findOne.mockResolvedValue(u);
    const res = await request(app).post('/api/auth/verify-reset-code').send({ email: 'ana@example.com', codigo: '123456' });
    expect(res.status).toBe(400);
  });

  test('Restablecer cambia la contraseña, limpia el código y cierra sesiones', async () => {
    const u = await usuarioConCodigo('123456');
    Usuario.findOne.mockResolvedValue(u);
    const res = await request(app).post('/api/auth/reset-password')
      .send({ email: 'ana@example.com', codigo: '123456', nuevaPassword: 'nuevaClave123' });
    expect(res.status).toBe(200);
    const cambios = u.update.mock.calls.at(-1)[0];
    expect(cambios).toMatchObject({ password: 'nuevaClave123', reset_code: null, reset_intentos: 0, token_version: 4 });
  });

  test('El código debe ser numérico de 6 dígitos', async () => {
    const res = await request(app).post('/api/auth/verify-reset-code').send({ email: 'ana@example.com', codigo: 'abcdef' });
    expect(res.status).toBe(400);
  });
});
