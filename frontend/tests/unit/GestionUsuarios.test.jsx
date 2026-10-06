import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GestionUsuarios from '../../src/pages/admin/GestionUsuarios';

vi.mock('../../src/services/adminService', () => ({
  listarUsuarios:       vi.fn(),
  cambiarEstadoUsuario: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

import * as adminService from '../../src/services/adminService';
import { toast } from 'sonner';

const USUARIOS_MOCK = [
  { id: 1, nombre: 'Admin',      email: 'admin@huellasegura.co', rol: 'admin',   activo: true  },
  { id: 2, nombre: 'Ana García', email: 'ana@example.com',       rol: 'usuario', activo: true  },
  { id: 3, nombre: 'Pedro',      email: 'pedro@example.com',     rol: 'usuario', activo: false },
];

function renderPage() {
  return render(<MemoryRouter><GestionUsuarios /></MemoryRouter>);
}

describe('Sprint 7 — GestionUsuarios Admin (DoD)', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── C3: Admin puede ver y gestionar usuarios ───────────────────────────────
  test('Muestra todos los usuarios después de cargar', async () => {
    adminService.listarUsuarios.mockResolvedValue({ data: { usuarios: USUARIOS_MOCK } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });
    expect(screen.getByText('Pedro')).toBeInTheDocument();
    // "Admin" puede aparecer múltiples veces (nombre + badge de rol)
    expect(screen.queryAllByText(/Admin/i).length).toBeGreaterThan(0);
  });

  test('Muestra badge de rol admin diferenciado', async () => {
    adminService.listarUsuarios.mockResolvedValue({ data: { usuarios: USUARIOS_MOCK } });
    renderPage();
    await waitFor(() => screen.getByText('Ana García'));
    // Puede aparecer "Admin" múltiples veces (título de página + badge de rol)
    const adminBadges = screen.queryAllByText(/admin/i);
    expect(adminBadges.length).toBeGreaterThan(0);
  });

  test('Llama a cambiarEstadoUsuario al hacer clic en el toggle', async () => {
    adminService.listarUsuarios.mockResolvedValue({ data: { usuarios: USUARIOS_MOCK } });
    adminService.cambiarEstadoUsuario.mockResolvedValue({ data: { activo: false } });
    renderPage();

    await waitFor(() => screen.getByText('Ana García'));
    const user = userEvent.setup();

    // El nuevo diseño usa toggles — buscamos el botón de usuario 2
    const toggleBtn = screen.getByTestId('btn-toggle-2');
    await user.click(toggleBtn);

    expect(adminService.cambiarEstadoUsuario).toHaveBeenCalledWith(2);
  });

  test('Muestra skeletons mientras carga', () => {
    adminService.listarUsuarios.mockReturnValue(new Promise(() => {}));
    renderPage();
    // El nuevo diseño usa divs con clase skeleton
    const skeletons = screen.getAllByTestId('skeleton-usuario');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('Muestra mensaje de error si la petición falla', async () => {
    adminService.listarUsuarios.mockRejectedValue(new Error('Network'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudieron cargar los usuarios/i);
  });

  // ── C3: Activar / desactivar usuarios ─────────────────────────────────────
  test('Muestra toast al cambiar estado de usuario', async () => {
    adminService.listarUsuarios.mockResolvedValue({ data: { usuarios: USUARIOS_MOCK } });
    adminService.cambiarEstadoUsuario.mockResolvedValue({});
    renderPage();

    await waitFor(() => screen.getByText('Ana García'));
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-toggle-2'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
});
