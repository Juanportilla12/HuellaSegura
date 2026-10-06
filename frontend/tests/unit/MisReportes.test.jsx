import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MisReportes from '../../src/pages/MisReportes';
import { ThemeProvider } from '../../src/providers/ThemeProvider';

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../../src/services/reporteService', () => ({
  misReportes:    vi.fn(),
  cambiarEstado:  vi.fn(),
}));

import * as reporteService from '../../src/services/reporteService';

// ─── Helper ───────────────────────────────────────────────────────────────────
function buildReporte(overrides = {}) {
  return {
    id: 1,
    mascota_id: 1,
    mascota: { id: 1, nombre: 'Firulais', especie: 'perro', foto_principal: null },
    latitud: 1.2136,
    longitud: -77.2811,
    descripcion: 'Se perdió en el parque',
    estado: 'en_busqueda',
    fecha_perdida: '2026-04-20',
    ...overrides,
  };
}

function renderPage() {
  return render(<ThemeProvider><MemoryRouter><MisReportes /></MemoryRouter></ThemeProvider>);
}

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('MisReportes', () => {
  beforeEach(() => vi.clearAllMocks());

  test('muestra estado vacío si el usuario no tiene reportes', async () => {
    reporteService.misReportes.mockResolvedValue({ data: { reportes: [] } });
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/no tienes reportes activos/i)).toBeInTheDocument();
  });

  test('renderiza una ReporteCard por cada reporte del usuario', async () => {
    const reportes = [
      buildReporte({ id: 1 }),
      buildReporte({ id: 2, mascota: { id: 2, nombre: 'Luna', especie: 'gato', foto_principal: null } }),
    ];
    reporteService.misReportes.mockResolvedValue({ data: { reportes } });
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByTestId('reporte-card')).toHaveLength(2);
    });
  });

  test('muestra estado de carga mientras obtiene los reportes', () => {
    reporteService.misReportes.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  test('muestra mensaje de error si la petición falla', async () => {
    reporteService.misReportes.mockRejectedValue(new Error('Network Error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument();
  });

  test('separa reportes activos e historial correctamente', async () => {
    const reportes = [
      buildReporte({ id: 1, estado: 'en_busqueda' }),
      buildReporte({ id: 2, estado: 'encontrada' }),
      buildReporte({ id: 3, estado: 'cerrado' }),
    ];
    reporteService.misReportes.mockResolvedValue({ data: { reportes } });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/en búsqueda \(1\)/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/historial \(2\)/i)).toBeInTheDocument();
  });

  test('llama a cambiarEstado al hacer clic en botón de estado', async () => {
    reporteService.misReportes.mockResolvedValue({
      data: { reportes: [buildReporte({ id: 1, estado: 'en_busqueda' })] },
    });
    reporteService.cambiarEstado.mockResolvedValue({ data: {} });
    renderPage();

    await waitFor(() => screen.getByTestId('reporte-card'));
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-estado-encontrada'));

    expect(reporteService.cambiarEstado).toHaveBeenCalledWith(1, 'encontrada');
  });
});
