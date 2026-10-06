import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ConfiguracionPerfil from '../../src/pages/ConfiguracionPerfil';

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id: 1, nombre: 'Ana García', email: 'ana@example.com', radio_alerta: 5 },
    logout: vi.fn(),
  }),
}));

vi.mock('../../src/providers/ThemeProvider', () => ({
  ThemeContext: { Consumer: ({ children }) => children({ isDark: false, toggleTheme: vi.fn() }) },
  useThemeContext: () => ({ isDark: false, toggleTheme: vi.fn() }),
}));

vi.mock('../../src/services/usuarioService', () => ({
  actualizarRadioAlerta: vi.fn(),
  actualizarUbicacion:   vi.fn(),
  desactivarUbicacion:   vi.fn(),
  actualizarPerfil:      vi.fn(),
  actualizarFoto:        vi.fn(),
  eliminarCuenta:        vi.fn(),
}));

vi.mock('../../src/services/reporteService', () => ({
  misReportes: vi.fn().mockResolvedValue({ data: { reportes: [
    { id: 1, estado: 'en_busqueda' }, { id: 2, estado: 'encontrada' },
  ] } }),
}));

vi.mock('../../src/services/mascotaService', () => ({
  listarMascotas: vi.fn().mockResolvedValue({ data: { mascotas: [] } }),
}));

// Mock Sonner para capturar toasts en tests
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error:   vi.fn(),
  }),
}));

import * as usuarioService from '../../src/services/usuarioService';
import { toast } from 'sonner';

function renderPage() {
  return render(<MemoryRouter><ConfiguracionPerfil /></MemoryRouter>);
}

describe('Sprint 5 — ConfiguracionPerfil (DoD)', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── C2: Panel muestra datos del usuario ───────────────────────────────────
  test('Muestra el nombre y correo del usuario', () => {
    renderPage();
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  // ── C3: Radio de alertas configurable 1-10 km ─────────────────────────────
  test('Renderiza el slider del radio de alerta con testid', () => {
    renderPage();
    expect(screen.getByTestId('slider-radio')).toBeInTheDocument();
    expect(screen.getByTestId('btn-guardar-radio')).toBeInTheDocument();
  });

  test('Slider inicia con el radio actual del usuario (5 km)', () => {
    renderPage();
    const slider = screen.getByTestId('slider-radio');
    expect(slider.value).toBe('5');
  });

  test('Llama a actualizarRadioAlerta al guardar', async () => {
    usuarioService.actualizarRadioAlerta.mockResolvedValue({ data: { radio_alerta: 5 } });
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-guardar-radio'));
    await waitFor(() => {
      expect(usuarioService.actualizarRadioAlerta).toHaveBeenCalledWith(5);
    });
  });

  test('Muestra toast de éxito tras guardar correctamente', async () => {
    usuarioService.actualizarRadioAlerta.mockResolvedValue({ data: {} });
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-guardar-radio'));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/actualizado/i)
      );
    });
  });

  test('Muestra toast de error si la actualización falla', async () => {
    usuarioService.actualizarRadioAlerta.mockRejectedValue({
      response: { data: { message: 'Error al guardar.' } },
    });
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-guardar-radio'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ── C6: Botón guardar radio visible en UI ────────────────────────────────
  test('Botón guardar radio no está deshabilitado inicialmente', () => {
    renderPage();
    const btn = screen.getByTestId('btn-guardar-radio');
    expect(btn).not.toBeDisabled();
  });

  // ── Datos reales (antes había cifras fijas en el código) ──────────────────
  test('Muestra conteos reales de reportes y encontradas', async () => {
    renderPage();
    expect(await screen.findByText('ENCONTRADAS')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('2').length).toBeGreaterThan(0));
    expect(screen.queryByText('Vecino verificado · La Aurora')).not.toBeInTheDocument();
  });

  // ── R8/R9: activar alertas pide la ubicación y la envía con consentimiento ─
  test('Activar alertas envía la ubicación del dispositivo', async () => {
    global.navigator.geolocation = {
      getCurrentPosition: (ok) => ok({ coords: { latitude: 1.21, longitude: -77.28 } }),
    };
    usuarioService.actualizarUbicacion.mockResolvedValue({});
    renderPage();
    await userEvent.setup().click(screen.getByRole('switch', { name: /alertas por proximidad/i }));
    await waitFor(() => expect(usuarioService.actualizarUbicacion).toHaveBeenCalledWith(1.21, -77.28));
  });
});
