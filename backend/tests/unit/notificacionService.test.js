process.env.JWT_SECRET = 'test_secret_huella_segura_2026';
process.env.NODE_ENV = 'test';

jest.mock('../../src/models', () => ({
  Usuario:      { findAll: jest.fn() },
  Notificacion: { bulkCreate: jest.fn().mockResolvedValue([]) },
  Mascota:      {},
  Reporte:      {},
}));

jest.mock('../../src/config/connection', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  define: jest.fn(),
}));

jest.mock('../../src/services/emailService', () => ({
  enviarCorreoAlertaProximidad: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../src/services/tiempoRealService', () => ({
  notificarUsuario: jest.fn(),
}));

const { generarNotificacionesProximidad } = require('../../src/services/notificacionService');
const { enviarCorreoAlertaProximidad } = require('../../src/services/emailService');
const { notificarUsuario } = require('../../src/services/tiempoRealService');
const { Usuario, Notificacion } = require('../../src/models');

// Reporte ubicado en el centro de Pasto
const REPORTE_MOCK = {
  id: 10,
  usuario_id: 99,               // propietario — no debe recibir notificación
  latitud: 1.2136,
  longitud: -77.2811,
};

describe('notificacionService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Genera notificaciones solo para usuarios dentro del radio configurado', async () => {
    const usuarios = [
      // Cerca: ~1.1 km — radio 5 km → debe notificar
      { id: 1, radio_alerta: 5,  ubicacion_lat: 1.2236, ubicacion_lng: -77.2811, activo: true },
      // Lejos: ~8.7 km — radio 5 km → no debe notificar
      { id: 2, radio_alerta: 5,  ubicacion_lat: 1.1385, ubicacion_lng: -77.2590, activo: true },
    ];
    Usuario.findAll.mockResolvedValue(usuarios);

    await generarNotificacionesProximidad(REPORTE_MOCK, 'Firulais');

    const llamada = Notificacion.bulkCreate.mock.calls[0][0];
    expect(llamada).toHaveLength(1);
    expect(llamada[0].usuario_id).toBe(1);
  });

  test('No genera notificación para el propio propietario del reporte', async () => {
    const usuarios = [
      // usuario 99 ES el propietario → no debe notificarse
      { id: 99, radio_alerta: 5, ubicacion_lat: 1.2200, ubicacion_lng: -77.2800, activo: true },
      { id: 1,  radio_alerta: 5, ubicacion_lat: 1.2200, ubicacion_lng: -77.2800, activo: true },
    ];
    Usuario.findAll.mockResolvedValue(usuarios);

    await generarNotificacionesProximidad(REPORTE_MOCK, 'Luna');

    const llamada = Notificacion.bulkCreate.mock.calls[0][0];
    expect(llamada.some((n) => n.usuario_id === 99)).toBe(false);
    expect(llamada.some((n) => n.usuario_id === 1)).toBe(true);
  });

  test('Respeta el radio configurado por cada usuario (1-10 km)', async () => {
    // Ambos usuarios a ~0.55 km del reporte (dentro de radio 1 km y 10 km)
    const usuarios = [
      { id: 1, radio_alerta: 1,  ubicacion_lat: 1.2186, ubicacion_lng: -77.2811, activo: true },
      { id: 2, radio_alerta: 10, ubicacion_lat: 1.2186, ubicacion_lng: -77.2811, activo: true },
    ];
    Usuario.findAll.mockResolvedValue(usuarios);

    await generarNotificacionesProximidad(REPORTE_MOCK, 'Max');

    const llamada = Notificacion.bulkCreate.mock.calls[0][0];
    // Ambos deben recibir notificación (distancia ~0.55 km < radio 1 km y 10 km)
    expect(llamada).toHaveLength(2);
  });

  test('No crea notificaciones si no hay usuarios cercanos', async () => {
    const usuarios = [
      // Bogotá, muy lejos
      { id: 1, radio_alerta: 5, ubicacion_lat: 4.7110, ubicacion_lng: -74.0721, activo: true },
    ];
    Usuario.findAll.mockResolvedValue(usuarios);

    const cantidad = await generarNotificacionesProximidad(REPORTE_MOCK, 'Rex');

    expect(Notificacion.bulkCreate).not.toHaveBeenCalled();
    expect(cantidad).toBe(0);
  });

  test('No notifica a usuarios sin ubicación configurada', async () => {
    const usuarios = [
      { id: 1, radio_alerta: 5, ubicacion_lat: null, ubicacion_lng: null, activo: true },
    ];
    Usuario.findAll.mockResolvedValue(usuarios);

    const cantidad = await generarNotificacionesProximidad(REPORTE_MOCK, 'Toby');

    expect(Notificacion.bulkCreate).not.toHaveBeenCalled();
    expect(cantidad).toBe(0);
  });

  test('R8/R9: cada usuario cercano recibe evento en tiempo real y correo', async () => {
    Usuario.findAll.mockResolvedValue([
      { id: 1, nombre: 'Ana', email: 'ana@example.com', radio_alerta: 5, ubicacion_lat: 1.2236, ubicacion_lng: -77.2811 },
      { id: 2, nombre: 'Leo', email: 'leo@example.com', radio_alerta: 1, ubicacion_lat: 1.1385, ubicacion_lng: -77.2590 },
    ]);

    const total = await generarNotificacionesProximidad(REPORTE_MOCK, 'Firulais');

    expect(total).toBe(1);
    expect(notificarUsuario).toHaveBeenCalledTimes(1);
    expect(notificarUsuario).toHaveBeenCalledWith(1, 'notificacion', expect.objectContaining({ reporte_id: 10 }));
    expect(enviarCorreoAlertaProximidad).toHaveBeenCalledTimes(1);
    expect(enviarCorreoAlertaProximidad.mock.calls[0][0].destinatario.email).toBe('ana@example.com');
  });

  test('Usuarios sin ubicación (sin consentimiento) no reciben alertas', async () => {
    Usuario.findAll.mockResolvedValue([
      { id: 1, nombre: 'Ana', email: 'ana@example.com', radio_alerta: 10, ubicacion_lat: null, ubicacion_lng: null },
    ]);
    const total = await generarNotificacionesProximidad(REPORTE_MOCK, 'Firulais');
    expect(total).toBe(0);
    expect(Notificacion.bulkCreate).not.toHaveBeenCalled();
    expect(enviarCorreoAlertaProximidad).not.toHaveBeenCalled();
  });
});
