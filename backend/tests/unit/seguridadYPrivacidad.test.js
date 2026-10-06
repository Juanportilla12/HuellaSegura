process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV = 'test';

const request = require('supertest');

jest.mock('../../src/models', () => ({
  Usuario:      { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), count: jest.fn() },
  Mascota:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Reporte:      { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), count: jest.fn() },
  Notificacion: { findAll: jest.fn(), update: jest.fn() },
  Avistamiento: { count: jest.fn() },
  EntidadAliada:{ findAll: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
}));

jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

const app = require('../../src/app');
const { sign } = require('../../src/config/jwt');
const { Usuario, Mascota, Reporte, EntidadAliada } = require('../../src/models');

function crearUsuario(datos = {}) {
  const u = {
    id: 2, nombre: 'Ana García', email: 'ana@example.com', celular: '3001234567',
    rol: 'usuario', token_version: 0, activo: true,
    ubicacion_lat: null, ubicacion_lng: null,
    update: jest.fn(async function (cambios) { Object.assign(u, cambios); return u; }),
    destroy: jest.fn().mockResolvedValue(),
    verificarPassword: jest.fn(),
    toPublicJSON: jest.fn(() => ({ id: u.id, nombre: u.nombre, celular: u.celular })),
    ...datos,
  };
  return u;
}

const TOKEN_USUARIO = sign({ id: 2, rol: 'usuario', tokenVersion: 0 });
const TOKEN_ADMIN   = sign({ id: 1, rol: 'admin',   tokenVersion: 0 });

beforeEach(() => jest.clearAllMocks());

describe('Autenticación — el token en la URL solo se acepta en /sse', () => {
  test('401 si se envía ?token= a una ruta normal', async () => {
    Usuario.findByPk.mockResolvedValue(crearUsuario());
    const res = await request(app).get(`/api/notificaciones?token=${TOKEN_USUARIO}`);
    expect(res.status).toBe(401);
  });

  test('Admin desactivado no puede usar el panel (403)', async () => {
    Usuario.findByPk.mockResolvedValue(crearUsuario({ id: 1, rol: 'admin', activo: false }));
    const res = await request(app)
      .get('/api/admin/estadisticas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(res.status).toBe(403);
  });
});

describe('Ley 1581 — privacidad y derechos del titular', () => {
  test('El perfil público muestra solo primer nombre y teléfono, nunca el correo', async () => {
    Mascota.findByPk.mockResolvedValue({
      id: 4, nombre: 'Luna', especie: 'perro', raza: null, sexo: 'hembra', color: 'negro',
      descripcion: null, foto_urls: [], video_url: null,
      propietario: { id: 2, nombre: 'Ana García', celular: '3001234567', email: 'ana@example.com' },
    });
    Reporte.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/publico/mascotas/4');
    expect(res.status).toBe(200);
    expect(res.body.propietario).toEqual({ nombre: 'Ana', telefono: '3001234567' });
    expect(JSON.stringify(res.body)).not.toContain('ana@example.com');
  });

  test('Retirar consentimiento borra la ubicación', async () => {
    const u = crearUsuario({ ubicacion_lat: 1.2, ubicacion_lng: -77.2 });
    Usuario.findByPk.mockResolvedValue(u);
    const res = await request(app)
      .delete('/api/usuarios/ubicacion')
      .set('Authorization', `Bearer ${TOKEN_USUARIO}`);
    expect(res.status).toBe(200);
    expect(u.update).toHaveBeenCalledWith({ ubicacion_lat: null, ubicacion_lng: null });
  });

  test('Eliminar cuenta exige la contraseña correcta', async () => {
    const u = crearUsuario();
    u.verificarPassword.mockResolvedValue(false);
    Usuario.findByPk.mockResolvedValue(u);
    const res = await request(app)
      .delete('/api/usuarios/cuenta')
      .set('Authorization', `Bearer ${TOKEN_USUARIO}`)
      .send({ password: 'incorrecta' });
    expect(res.status).toBe(401);
    expect(u.destroy).not.toHaveBeenCalled();
  });

  test('Eliminar cuenta con contraseña correcta borra al usuario', async () => {
    const u = crearUsuario();
    u.verificarPassword.mockResolvedValue(true);
    Usuario.findByPk.mockResolvedValue(u);
    const res = await request(app)
      .delete('/api/usuarios/cuenta')
      .set('Authorization', `Bearer ${TOKEN_USUARIO}`)
      .send({ password: 'password123' });
    expect(res.status).toBe(200);
    expect(u.destroy).toHaveBeenCalled();
  });

  test('Actualizar perfil valida el formato del celular', async () => {
    Usuario.findByPk.mockResolvedValue(crearUsuario());
    const res = await request(app)
      .put('/api/usuarios/perfil')
      .set('Authorization', `Bearer ${TOKEN_USUARIO}`)
      .send({ celular: 'abc' });
    expect(res.status).toBe(400);
  });
});

describe('HU-27 — Entidades aliadas', () => {
  test('Un usuario normal no puede crear entidades (403)', async () => {
    Usuario.findByPk.mockResolvedValue(crearUsuario());
    const res = await request(app)
      .post('/api/entidades-aliadas')
      .set('Authorization', `Bearer ${TOKEN_USUARIO}`)
      .send({ nombre: 'Vet', tipo: 'veterinaria' });
    expect(res.status).toBe(403);
  });

  test('Crear ignora campos no permitidos (id, activo)', async () => {
    Usuario.findByPk.mockResolvedValue(crearUsuario({ id: 1, rol: 'admin' }));
    EntidadAliada.create.mockImplementation(async (d) => ({ id: 9, ...d }));
    const res = await request(app)
      .post('/api/entidades-aliadas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Vet Centro', tipo: 'veterinaria', horario: 'Lun–Sáb 8–18', id: 999, activo: false });
    expect(res.status).toBe(201);
    const datos = EntidadAliada.create.mock.calls[0][0];
    expect(datos).toMatchObject({ nombre: 'Vet Centro', horario: 'Lun–Sáb 8–18' });
    expect(datos).not.toHaveProperty('id');
    expect(datos).not.toHaveProperty('activo');
  });

  test('Eliminar hace baja lógica (activo = false)', async () => {
    Usuario.findByPk.mockResolvedValue(crearUsuario({ id: 1, rol: 'admin' }));
    const entidad = { update: jest.fn().mockResolvedValue() };
    EntidadAliada.findByPk.mockResolvedValue(entidad);
    const res = await request(app)
      .delete('/api/entidades-aliadas/3')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`);
    expect(res.status).toBe(200);
    expect(entidad.update).toHaveBeenCalledWith({ activo: false });
  });

  test('Rechaza latitud fuera de rango', async () => {
    Usuario.findByPk.mockResolvedValue(crearUsuario({ id: 1, rol: 'admin' }));
    const res = await request(app)
      .post('/api/entidades-aliadas')
      .set('Authorization', `Bearer ${TOKEN_ADMIN}`)
      .send({ nombre: 'Vet', tipo: 'veterinaria', latitud: 200 });
    expect(res.status).toBe(400);
  });
});

describe('R5 — Video de la mascota', () => {
  test('Rechaza archivos que no son video con 400', async () => {
    Usuario.findByPk.mockResolvedValue(crearUsuario());
    const res = await request(app)
      .post('/api/mascotas/4/video')
      .set('Authorization', `Bearer ${TOKEN_USUARIO}`)
      .attach('video', Buffer.from('no es un video'), { filename: 'x.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});

describe('Manejo de errores', () => {
  test('JSON mal formado → 400 con mensaje propio', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{malformado');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El cuerpo de la petición no es un JSON válido.');
  });

  test('Origen no permitido por CORS → 403', async () => {
    const res = await request(app).get('/api/reportes').set('Origin', 'https://sitio-malo.com');
    expect(res.status).toBe(403);
  });
});
