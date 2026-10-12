import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Alertas from '../../src/pages/Alertas';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({ ...(await importOriginal()), useNavigate: () => mockNavigate }));

vi.mock('../../src/services/notificacionService', () => ({
  listarNotificaciones: vi.fn(),
  marcarLeida: vi.fn().mockResolvedValue({}),
  marcarTodasLeidas: vi.fn().mockResolvedValue({}),
}));
vi.mock('../../src/context/NotificacionesContext', () => ({ useNotificaciones: () => ({ noLeidas: 0, refrescar: vi.fn() }) }));
vi.mock('../../src/context/AuthContext', () => ({ useAuth: () => ({ usuario: { id: 1, alertas_activas: false } }) }));
vi.mock('../../src/components/ui/BottomNav', () => ({ default: () => null }));

import { listarNotificaciones, marcarLeida } from '../../src/services/notificacionService';

const ahora = new Date().toISOString();
const NOTIFS = [
  { id: 1, tipo: 'avistamiento', leida: false, reporte_id: 5, created_at: ahora,
    mensaje: '¡Alguien vio a Max! Contacta a quien la vio al 300 123 4567. Revisa el mapa para ver dónde.' },
  { id: 2, tipo: 'proximidad', leida: true, reporte_id: 9, created_at: '2026-01-02T10:00:00Z',
    mensaje: '¡Alerta! Se reportó una mascota perdida a 0.8 km de tu ubicación: Luna.' },
];

function renderPage() {
  return render(<MemoryRouter><Alertas /></MemoryRouter>);
}

describe('Alertas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarNotificaciones.mockResolvedValue({ data: { notificaciones: NOTIFS } });
  });

  test('Agrupa por fecha y muestra cuántas faltan por leer', async () => {
    renderPage();
    expect(await screen.findByTestId('notif-item-1')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Hoy' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Anteriores' })).toBeInTheDocument();
    expect(screen.getByText('1 sin leer')).toBeInTheDocument();
  });

  test('En un avistamiento ofrece llamar y escribir por WhatsApp al testigo', async () => {
    renderPage();
    await screen.findByTestId('notif-item-1');
    expect(screen.getByRole('link', { name: /llamar/i })).toHaveAttribute('href', 'tel:3001234567');
    expect(screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href')).toContain('wa.me/573001234567');
  });

  test('Al tocar una alerta la marca como leída y abre el reporte en el mapa', async () => {
    renderPage();
    const item = await screen.findByTestId('notif-item-1');
    fireEvent.click(item.querySelector('button'));
    await waitFor(() => expect(marcarLeida).toHaveBeenCalledWith(1));
    expect(mockNavigate).toHaveBeenCalledWith('/mapa?reporte=5');
  });

  test('La pestaña "Cerca de mí" muestra solo alertas de proximidad', async () => {
    renderPage();
    await screen.findByTestId('notif-item-1');
    fireEvent.click(screen.getByRole('tab', { name: /cerca de mí/i }));
    expect(screen.queryByTestId('notif-item-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('notif-item-2')).toBeInTheDocument();
  });

  test('Si las alertas están desactivadas invita a activarlas', async () => {
    renderPage();
    expect(await screen.findByText(/activa las alertas cerca de ti/i)).toBeInTheDocument();
  });
});
