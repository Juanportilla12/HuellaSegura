import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MisMascotas from '../../src/pages/MisMascotas';
import { ThemeProvider } from '../../src/providers/ThemeProvider';

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../../src/services/mascotaService', () => ({
  listarMascotas: vi.fn(),
  eliminarMascota: vi.fn(),
}));

import * as mascotaService from '../../src/services/mascotaService';

// ─── Helper ───────────────────────────────────────────────────────────────────
function buildMascota(overrides = {}) {
  return {
    id: 1,
    nombre: 'Firulais',
    especie: 'perro',
    raza: 'Labrador',
    sexo: 'macho',
    color: 'Dorado',
    edad: 3,
    edad_unidad: 'años',
    foto_urls: [],
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <MisMascotas />
      </MemoryRouter>
    </ThemeProvider>
  );
}

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('MisMascotas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('muestra estado vacío si el usuario no tiene mascotas', async () => {
    mascotaService.listarMascotas.mockResolvedValue({ data: { mascotas: [] } });
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/aún no tienes mascotas registradas/i)).toBeInTheDocument();
  });

  test('renderiza una MascotaCard por cada mascota del usuario', async () => {
    const mascotas = [
      buildMascota({ id: 1, nombre: 'Firulais' }),
      buildMascota({ id: 2, nombre: 'Luna', especie: 'gato', sexo: 'hembra' }),
      buildMascota({ id: 3, nombre: 'Toby' }),
    ];
    mascotaService.listarMascotas.mockResolvedValue({ data: { mascotas } });
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByTestId('mascota-card')).toHaveLength(3);
    });
    expect(screen.getByText('Firulais')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
    expect(screen.getByText('Toby')).toBeInTheDocument();
  });

  test('muestra spinner de carga mientras obtiene las mascotas', () => {
    // Promesa que nunca resuelve para simular carga
    mascotaService.listarMascotas.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.spinner-border')).toBeInTheDocument();
  });

  test('muestra mensaje de error si la petición falla', async () => {
    mascotaService.listarMascotas.mockRejectedValue(new Error('Network Error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument();
  });

  test('llama a listarMascotas al montar el componente', async () => {
    mascotaService.listarMascotas.mockResolvedValue({ data: { mascotas: [] } });
    renderPage();
    await waitFor(() => {
      expect(mascotaService.listarMascotas).toHaveBeenCalledTimes(1);
    });
  });
});
