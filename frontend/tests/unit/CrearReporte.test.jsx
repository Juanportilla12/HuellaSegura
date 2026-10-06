import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CrearReporte from '../../src/pages/CrearReporte';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/services/reporteService', () => ({
  crearReporte: vi.fn(),
}));

vi.mock('../../src/services/mascotaService', () => ({
  listarMascotas: vi.fn(),
}));

vi.mock('../../src/components/MapaSelector', () => ({
  default: ({ onCoordsChange }) => (
    <div data-testid="mapa-selector">
      <button
        type="button"
        data-testid="simular-ubicacion"
        onClick={() => onCoordsChange(1.2136, -77.2811)}
      >
        Simular ubicación
      </button>
    </div>
  ),
}));

import * as reporteService from '../../src/services/reporteService';
import * as mascotaService from '../../src/services/mascotaService';

const MASCOTAS = [
  { id: 7, nombre: 'Luna', especie: 'perro', foto_principal: null },
  { id: 9, nombre: 'Michi', especie: 'gato', foto_principal: null },
];

function renderPage(url = '/reportes/nuevo') {
  return render(<MemoryRouter initialEntries={[url]}><CrearReporte /></MemoryRouter>);
}

// ─── Suite — Sprint 3 — HU-09 Crear reporte de pérdida ────────────────────────
describe('Sprint 3 — CrearReporte (HU-09 / R6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Geolocalización denegada: el usuario debe marcar el punto en el mapa
    global.navigator.geolocation = {
      getCurrentPosition: (_ok, error) => error(new Error('denegado')),
    };
    fetch.mockResolvedValue({ json: async () => ({ address: { road: 'Calle 18' } }) });
    mascotaService.listarMascotas.mockResolvedValue({ data: { mascotas: MASCOTAS } });
  });

  test('Lista las mascotas del usuario para elegir cuál se perdió', async () => {
    renderPage();
    expect(await screen.findByTestId('mascota-opcion-7')).toBeInTheDocument();
    expect(screen.getByTestId('mascota-opcion-9')).toBeInTheDocument();
  });

  test('Renderiza el selector de mapa como alternativa al GPS', async () => {
    renderPage();
    expect(screen.getByTestId('mapa-selector')).toBeInTheDocument();
    expect(await screen.findByText(/toca el mapa para marcar/i)).toBeInTheDocument();
  });

  test('No envía sin seleccionar mascota', async () => {
    renderPage();
    await screen.findByTestId('mascota-opcion-7');
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.submit(screen.getByTestId('form-reporte'));
    expect(await screen.findByText(/selecciona la mascota/i)).toBeInTheDocument();
    expect(reporteService.crearReporte).not.toHaveBeenCalled();
  });

  test('No envía sin ubicación marcada en el mapa', async () => {
    renderPage();
    fireEvent.click(await screen.findByTestId('mascota-opcion-7'));
    fireEvent.submit(screen.getByTestId('form-reporte'));
    expect(await screen.findByText(/marca en el mapa/i)).toBeInTheDocument();
    expect(reporteService.crearReporte).not.toHaveBeenCalled();
  });

  test('Envía mascota_id, coordenadas y fecha al backend', async () => {
    reporteService.crearReporte.mockResolvedValue({ data: { success: true } });
    renderPage();
    fireEvent.click(await screen.findByTestId('mascota-opcion-7'));
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.change(screen.getByTestId('input-descripcion'), { target: { value: 'Collar rojo' } });
    fireEvent.submit(screen.getByTestId('form-reporte'));

    await waitFor(() => expect(reporteService.crearReporte).toHaveBeenCalledTimes(1));
    const datos = reporteService.crearReporte.mock.calls[0][0];
    expect(datos.mascota_id).toBe(7);
    expect(datos.latitud).toBe(1.2136);
    expect(datos.longitud).toBe(-77.2811);
    expect(datos.fecha_perdida).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(datos.descripcion).toBe('Collar rojo');
  });

  test('Preselecciona la mascota desde ?mascota_id= y muestra éxito', async () => {
    reporteService.crearReporte.mockResolvedValue({ data: { success: true } });
    renderPage('/reportes/nuevo?mascota_id=9');
    await screen.findByTestId('mascota-opcion-9');
    expect(screen.getByTestId('mascota-opcion-9')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.submit(screen.getByTestId('form-reporte'));
    expect(await screen.findByText(/reporte publicado/i)).toBeInTheDocument();
  });

  test('Muestra el error del servidor si falla la publicación', async () => {
    reporteService.crearReporte.mockRejectedValue({ response: { data: { message: 'Mascota no encontrada.' } } });
    renderPage('/reportes/nuevo?mascota_id=7');
    await screen.findByTestId('mascota-opcion-7');
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.submit(screen.getByTestId('form-reporte'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mascota no encontrada.');
  });
});
