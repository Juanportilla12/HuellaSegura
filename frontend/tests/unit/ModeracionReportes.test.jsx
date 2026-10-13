import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ModeracionReportes from '../../src/pages/admin/ModeracionReportes';

vi.mock('../../src/services/adminService', () => ({ listarReportesAdmin: vi.fn(), moderarReporte: vi.fn() }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

import { listarReportesAdmin, moderarReporte } from '../../src/services/adminService';
import { toast } from 'sonner';

const REPORTES = [
  { id: 1, estado: 'en_busqueda', moderado: false, fecha_perdida: '2026-10-01', descripcion: 'Collar rojo',
    mascota: { nombre: 'Luna', especie: 'perro', foto_urls: [] }, reportante: { nombre: 'Ana', email: 'ana@example.com' } },
  { id: 2, estado: 'en_busqueda', moderado: true, fecha_perdida: '2026-10-02',
    mascota: { nombre: 'Michi', especie: 'gato', foto_urls: [] }, reportante: { nombre: 'Leo', email: 'leo@example.com' } },
];

function renderPage() {
  return render(<MemoryRouter><ModeracionReportes /></MemoryRouter>);
}

describe('Moderación de reportes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarReportesAdmin.mockResolvedValue({ data: { reportes: REPORTES } });
  });

  test('Muestra la mascota y quién publicó el reporte', async () => {
    renderPage();
    expect(await screen.findByText('Luna')).toBeInTheDocument();
    expect(screen.getByText(/ana@example\.com/)).toBeInTheDocument();
  });

  test('Ocultar pide confirmación antes de llamar a la API', async () => {
    moderarReporte.mockResolvedValue({ data: { moderado: true } });
    renderPage();
    fireEvent.click(await screen.findByTestId('btn-moderar-1'));
    expect(moderarReporte).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Ocultar del mapa' }));
    await waitFor(() => expect(moderarReporte).toHaveBeenCalledWith(1));
    // Ahora hay dos ocultos: el recién moderado y el que ya lo estaba
    await waitFor(() => expect(screen.getAllByText(/oculto del mapa por incumplir/i)).toHaveLength(2));
  });

  test('Si la API falla, el reporte no cambia de estado', async () => {
    moderarReporte.mockRejectedValue({ response: { data: { message: 'Error del servidor' } } });
    renderPage();
    fireEvent.click(await screen.findByTestId('btn-moderar-1'));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Ocultar del mapa' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error del servidor'));
    expect(screen.getAllByText(/oculto del mapa por incumplir/i)).toHaveLength(1); // solo el que ya estaba oculto
  });

  test('Volver a mostrar un reporte oculto es inmediato', async () => {
    moderarReporte.mockResolvedValue({ data: { moderado: false } });
    renderPage();
    fireEvent.click(await screen.findByTestId('btn-moderar-2'));
    await waitFor(() => expect(moderarReporte).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByText(/oculto del mapa por incumplir/i)).not.toBeInTheDocument());
  });
});
