import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { prepararFoto, prepararFotos, FotoNoValida } from '../../src/utils/imagen';
import { entrarComoInvitado, salirDeInvitado } from '../../src/utils/invitado';
import ProtectedRoute from '../../src/components/ProtectedRoute';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ estaAutenticado: false, esAdmin: false, cargando: false }),
}));

describe('prepararFoto (utils/imagen.js)', () => {
  test('Rechaza un archivo que no es imagen', async () => {
    const pdf = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    await expect(prepararFoto(pdf)).rejects.toBeInstanceOf(FotoNoValida);
  });

  test('Si el navegador no puede procesarla, un JPG que el servidor acepta se usa tal cual', async () => {
    const jpg = new File(['x'], 'perro.jpg', { type: 'image/jpeg' });
    await expect(prepararFoto(jpg)).resolves.toBe(jpg);
  });

  test('Si no se puede procesar ni subir tal cual (p. ej. HEIC), avisa con un mensaje claro', async () => {
    const heic = new File(['x'], 'IMG_0001.heic', { type: 'image/heic' });
    await expect(prepararFoto(heic)).rejects.toThrow(/no pudimos leer esta foto/i);
  });

  test('prepararFotos separa las válidas de las rechazadas', async () => {
    const { validas, rechazadas } = await prepararFotos([
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['x'], 'b.txt', { type: 'text/plain' }),
    ]);
    expect(validas).toHaveLength(1);
    expect(rechazadas).toBe(1);
  });
});

describe('Modo invitado (ProtectedRoute)', () => {
  beforeEach(() => {
    salirDeInvitado();
    localStorage.setItem('hs-bienvenida-vista', '1');
  });

  function renderRuta(permitirInvitado) {
    return render(
      <MemoryRouter initialEntries={['/mapa']}>
        <Routes>
          <Route element={<ProtectedRoute permitirInvitado={permitirInvitado} />}>
            <Route path="/mapa" element={<p>Mapa visible</p>} />
          </Route>
          <Route path="/login" element={<p>Pantalla de login</p>} />
        </Routes>
      </MemoryRouter>
    );
  }

  test('Quien eligió "Explorar como invitado" ve las pantallas permitidas', () => {
    entrarComoInvitado();
    renderRuta(true);
    expect(screen.getByText('Mapa visible')).toBeInTheDocument();
  });

  test('Sin elegir el modo invitado, se pide iniciar sesión', () => {
    renderRuta(true);
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  test('El modo invitado no abre pantallas que requieren cuenta', () => {
    entrarComoInvitado();
    renderRuta(false);
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });
});
