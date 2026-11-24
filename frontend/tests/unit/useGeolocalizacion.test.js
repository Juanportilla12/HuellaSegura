import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocalizacion } from '../../src/hooks/useGeolocalizacion';

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('useGeolocalizacion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Permiso ya concedido en el navegador: no se muestra la ventana de la app
    Object.defineProperty(global.navigator, 'permissions', {
      value: { query: vi.fn().mockResolvedValue({ state: 'granted' }) }, configurable: true,
    });
  });

  test('Retorna coordenadas cuando el navegador las concede', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((onSuccess) => {
        onSuccess({ coords: { latitude: 1.2136, longitude: -77.2811 } });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation, configurable: true,
    });

    const { result } = renderHook(() => useGeolocalizacion());

    await act(async () => { result.current.obtenerUbicacion(); });

    expect(result.current.coords).toEqual({ lat: 1.2136, lng: -77.2811 });
    expect(result.current.error).toBeNull();
    expect(result.current.cargando).toBe(false);
  });

  test('Retorna error cuando el usuario deniega la geolocalización', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((onSuccess, onError) => {
        onError({ code: 1, message: 'User denied Geolocation' });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation, configurable: true,
    });

    const { result } = renderHook(() => useGeolocalizacion());

    await act(async () => { result.current.obtenerUbicacion(); });

    expect(result.current.coords).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toMatch(/ubicación/i);
    expect(result.current.cargando).toBe(false);
  });

  test('Estado inicial: sin coords, sin error, sin carga', () => {
    const { result } = renderHook(() => useGeolocalizacion());
    expect(result.current.coords).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.cargando).toBe(false);
  });

  test('Retorna error si el navegador no soporta geolocalización', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined, configurable: true,
    });

    const { result } = renderHook(() => useGeolocalizacion());
    act(() => { result.current.obtenerUbicacion(); });

    expect(result.current.error).toMatch(/navegador/i);
    expect(result.current.coords).toBeNull();
  });
});
