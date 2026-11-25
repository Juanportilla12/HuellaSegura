import { describe, test, expect, vi, afterEach } from 'vitest';
import { obtenerUbicacion, mensajeErrorUbicacion } from '../../src/utils/ubicacion';

// Simula el GPS: cada llamada devuelve la siguiente respuesta de la lista
function simularGps(...respuestas) {
  const getCurrentPosition = vi.fn((ok, error) => {
    const r = respuestas.shift();
    if (r.error) error(r.error);
    else ok({ coords: { latitude: r.lat, longitude: r.lng, accuracy: r.precision } });
  });
  Object.defineProperty(global.navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
  return getCurrentPosition;
}

afterEach(() => vi.restoreAllMocks());

describe('Ubicación del dispositivo', () => {
  test('usa una ubicación precisa del GPS', async () => {
    simularGps({ lat: 1.2136, lng: -77.2811, precision: 25 });
    await expect(obtenerUbicacion()).resolves.toMatchObject({ lat: 1.2136, lng: -77.2811 });
  });

  test('NO usa una ubicación aproximada por la red (p. ej. Cali estando en Pasto)', async () => {
    simularGps({ lat: 3.4516, lng: -76.532, precision: 40000 });
    await expect(obtenerUbicacion()).rejects.toMatchObject({ code: 'IMPRECISA', metros: 40000 });
  });

  test('si el GPS no responde, el respaldo aproximado tampoco se acepta si es impreciso', async () => {
    simularGps({ error: { code: 3 } }, { lat: 3.4516, lng: -76.532, precision: 25000 });
    await expect(obtenerUbicacion()).rejects.toMatchObject({ code: 'IMPRECISA' });
  });

  test('el respaldo por wifi, si es preciso, sí sirve', async () => {
    simularGps({ error: { code: 3 } }, { lat: 1.214, lng: -77.28, precision: 120 });
    await expect(obtenerUbicacion()).resolves.toMatchObject({ lat: 1.214 });
  });

  test('el mensaje explica el error en km y cómo activar la ubicación exacta', () => {
    const msg = mensajeErrorUbicacion({ code: 'IMPRECISA', metros: 40000 });
    expect(msg).toMatch(/ubicación aproximada/i);
    expect(msg).toMatch(/40 km/);
    expect(msg).toMatch(/toca el mapa/i);
  });
});
