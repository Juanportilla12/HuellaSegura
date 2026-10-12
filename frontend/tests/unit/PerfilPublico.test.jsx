import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PerfilPublico from '../../src/pages/PerfilPublico';

vi.mock('../../src/services/perfilPublicoService', () => ({
  obtenerPerfilPublico: vi.fn(),
  urlCompartirMascota: (id) => `http://api.test/publico/compartir/mascotas/${id}`,
  crearAvistamiento:    vi.fn(),
}));

import * as perfilPublicoService from '../../src/services/perfilPublicoService';

function buildDatos(overrides = {}) {
  return {
    success: true,
    mascota: {
      id: 1, nombre: 'Firulais', especie: 'perro', raza: 'Labrador',
      sexo: 'macho', color: 'Dorado', descripcion: 'Muy amigable',
      foto_urls: [], foto_principal: null,
    },
    propietario: { id: 1, nombre: 'Ana García', telefono: null },
    reporte_activo: null,
    ...overrides,
  };
}

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/publico/mascotas/${id}`]}>
      <Routes>
        <Route path="/publico/mascotas/:codigo" element={<PerfilPublico />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Sprint 6 — PerfilPublico (DoD)', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── C5: Accesible sin login — muestra nombre de mascota ───────────────────
  test('Muestra el nombre de la mascota en el perfil público', async () => {
    perfilPublicoService.obtenerPerfilPublico.mockResolvedValue({ data: buildDatos() });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Firulais')).toBeInTheDocument();
    });
  });

  test('Muestra la raza de la mascota (identificador de especie)', async () => {
    perfilPublicoService.obtenerPerfilPublico.mockResolvedValue({ data: buildDatos() });
    renderPage();
    // La raza "Labrador" identifica al animal y está en los chips del perfil
    await waitFor(() => {
      expect(screen.getByText('Labrador')).toBeInTheDocument();
    });
  });

  // ── C5: Propietario sin email (privacidad) ────────────────────────────────
  test('Muestra el nombre del propietario', async () => {
    perfilPublicoService.obtenerPerfilPublico.mockResolvedValue({ data: buildDatos() });
    renderPage();
    await waitFor(() => {
      // El nombre del propietario debe aparecer en algún lugar de la página
      expect(screen.queryAllByText(/Ana García/i).length).toBeGreaterThan(0);
    });
  });

  test('No muestra el email del propietario (privacidad)', async () => {
    perfilPublicoService.obtenerPerfilPublico.mockResolvedValue({ data: buildDatos() });
    renderPage();
    await waitFor(() => screen.getByText('Firulais'));
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
  });

  // ── C6: Badge estado PERDIDO cuando hay reporte activo ───────────────────
  test('Muestra badge "Perdido" cuando hay reporte activo', async () => {
    const datos = buildDatos({
      reporte_activo: { id: 5, latitud: 1.21, longitud: -77.28, fecha_perdida: '2026-04-20', descripcion: null, created_at: new Date().toISOString() },
    });
    perfilPublicoService.obtenerPerfilPublico.mockResolvedValue({ data: datos });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/perdido/i)).toBeInTheDocument();
    });
  });

  test('Muestra badge "En casa" cuando NO hay reporte activo', async () => {
    perfilPublicoService.obtenerPerfilPublico.mockResolvedValue({ data: buildDatos() });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/en casa/i)).toBeInTheDocument();
    });
  });

  // ── C1: Botón para reportar avistamiento ─────────────────────────────────
  test('Muestra botón para reportar avistamiento', async () => {
    perfilPublicoService.obtenerPerfilPublico.mockResolvedValue({ data: buildDatos() });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/la vi/i)).toBeInTheDocument();
    });
  });

  // El backend solo envía fecha_perdida (no created_at): antes se mostraba 'Hace NaNh'
  test('Calcula el tiempo de pérdida con fecha_perdida, sin NaN', async () => {
    const hace3 = new Date(Date.now() - 3 * 864e5);
    const fecha = `${hace3.getFullYear()}-${String(hace3.getMonth() + 1).padStart(2, '0')}-${String(hace3.getDate()).padStart(2, '0')}`;
    const datos = buildDatos({ reporte_activo: { id: 5, latitud: 1.21, longitud: -77.28, fecha_perdida: fecha, descripcion: null } });
    perfilPublicoService.obtenerPerfilPublico.mockResolvedValue({ data: datos });
    renderPage();
    await waitFor(() => expect(screen.getByText('Perdido hace 3 días')).toBeInTheDocument());
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  // ── Mascota no encontrada ────────────────────────────────────────────────
  test('Muestra error si la mascota no existe', async () => {
    perfilPublicoService.obtenerPerfilPublico.mockRejectedValue(new Error('404'));
    renderPage('999');
    await waitFor(() => {
      expect(screen.getByText(/no encontrada/i)).toBeInTheDocument();
    });
  });
});
