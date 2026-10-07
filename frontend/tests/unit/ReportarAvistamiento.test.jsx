import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportarAvistamiento from '../../src/pages/ReportarAvistamiento';
import { ThemeProvider } from '../../src/providers/ThemeProvider';

vi.mock('../../src/services/avistamientoService', () => ({ crearAvistamiento: vi.fn() }));
vi.mock('../../src/services/reporteService', () => ({ listarReportesActivos: vi.fn() }));
vi.mock('../../src/services/perfilPublicoService', () => ({ obtenerPerfilPublico: vi.fn() }));
vi.mock('../../src/services/geocodificacionService', () => ({ geocodificarReversa: vi.fn().mockResolvedValue('CALLE 18') }));
vi.mock('../../src/components/MapaSelector', () => ({
  default: ({ onCoordsChange }) => (
    <button type="button" data-testid="simular-ubicacion" onClick={() => onCoordsChange(1.21, -77.28)}>mapa</button>
  ),
}));

import { crearAvistamiento } from '../../src/services/avistamientoService';
import { listarReportesActivos } from '../../src/services/reporteService';
import { obtenerPerfilPublico } from '../../src/services/perfilPublicoService';

const REPORTES = [
  { id: 1, fecha_perdida: '2026-10-01', mascota: { id: 5, nombre: 'Luna', especie: 'perro', raza: 'Criolla', color: 'negro', foto_principal: null } },
  { id: 2, fecha_perdida: '2026-10-02', mascota: { id: 8, nombre: 'Michi', especie: 'gato', raza: null, color: 'gris', foto_principal: null } },
];

function renderPage(url = '/avistamientos/nuevo') {
  return render(
    <ThemeProvider><MemoryRouter initialEntries={[url]}><ReportarAvistamiento /></MemoryRouter></ThemeProvider>
  );
}

describe('Sprint 6 — Reportar avistamiento (R7 / R11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarReportesActivos.mockResolvedValue({ data: { reportes: REPORTES } });
    obtenerPerfilPublico.mockResolvedValue({ data: { mascota: { id: 5, codigo_publico: '55555555-5555-4555-8555-555555555555', nombre: 'Luna', especie: 'perro' } } });
  });

  test('Sin QR, muestra la lista de mascotas perdidas para elegir (no pide un ID)', async () => {
    renderPage();
    expect(await screen.findByTestId('opcion-mascota-5')).toBeInTheDocument();
    expect(screen.getByTestId('opcion-mascota-8')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ID/i)).not.toBeInTheDocument();
  });

  test('No envía si no se elige mascota', async () => {
    renderPage();
    await screen.findByTestId('opcion-mascota-5');
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.submit(screen.getByTestId('form-avistamiento'));
    expect(await screen.findByText(/elige la mascota/i)).toBeInTheDocument();
    expect(crearAvistamiento).not.toHaveBeenCalled();
  });

  test('Envía la mascota elegida y las coordenadas', async () => {
    crearAvistamiento.mockResolvedValue({ data: { success: true } });
    renderPage();
    fireEvent.click(await screen.findByTestId('opcion-mascota-8'));
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.submit(screen.getByTestId('form-avistamiento'));
    await waitFor(() => expect(crearAvistamiento).toHaveBeenCalledTimes(1));
    expect(crearAvistamiento.mock.calls[0][0]).toMatchObject({ mascota_id: 8, latitud: 1.21, longitud: -77.28 });
    expect(await screen.findByText(/gracias por ayudar/i)).toBeInTheDocument();
  });

  test('Desde el QR la mascota ya viene elegida', async () => {
    crearAvistamiento.mockResolvedValue({ data: { success: true } });
    renderPage('/avistamientos/nuevo?mascota=55555555-5555-4555-8555-555555555555');
    expect(await screen.findByTestId('mascota-desde-qr')).toHaveTextContent('Luna');
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.submit(screen.getByTestId('form-avistamiento'));
    await waitFor(() => expect(crearAvistamiento.mock.calls[0][0].mascota_id).toBe(5));
    expect(obtenerPerfilPublico).toHaveBeenCalledWith('55555555-5555-4555-8555-555555555555');
  });

  test('Si el servidor falla NO muestra éxito falso', async () => {
    crearAvistamiento.mockRejectedValue({ response: { status: 500, data: { message: 'Error interno del servidor.' } } });
    renderPage('/avistamientos/nuevo?mascota=55555555-5555-4555-8555-555555555555');
    await screen.findByTestId('mascota-desde-qr');
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.submit(screen.getByTestId('form-avistamiento'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor.');
    expect(screen.queryByText(/gracias por ayudar/i)).not.toBeInTheDocument();
  });

  test('Muestra el mensaje del límite de envíos (429)', async () => {
    crearAvistamiento.mockRejectedValue({ response: { status: 429, data: { message: 'Has enviado varios avistamientos seguidos.' } } });
    renderPage('/avistamientos/nuevo?mascota=55555555-5555-4555-8555-555555555555');
    await screen.findByTestId('mascota-desde-qr');
    fireEvent.click(screen.getByTestId('simular-ubicacion'));
    fireEvent.submit(screen.getByTestId('form-avistamiento'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/varios avistamientos seguidos/);
  });
});
