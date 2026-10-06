import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BotonesCompartir from '../../src/components/BotonesCompartir';

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost:5173' },
  writable: true,
});

function renderBotones(props = {}) {
  return render(
    <MemoryRouter>
      <BotonesCompartir mascotaId={1} nombreMascota="Firulais" {...props} />
    </MemoryRouter>
  );
}

describe('BotonesCompartir', () => {
  test('renderiza los botones de Facebook y WhatsApp', () => {
    renderBotones();
    expect(screen.getByTestId('btn-facebook')).toBeInTheDocument();
    expect(screen.getByTestId('btn-whatsapp')).toBeInTheDocument();
  });

  test('El link de Facebook contiene la URL del perfil público', () => {
    renderBotones();
    const btn = screen.getByTestId('btn-facebook');
    expect(btn.href).toContain('facebook.com/sharer');
    expect(btn.href).toContain(encodeURIComponent('/publico/compartir/mascotas/1'));
  });

  test('El link de WhatsApp contiene el texto y la URL correctos', () => {
    renderBotones();
    const btn = screen.getByTestId('btn-whatsapp');
    expect(btn.href).toContain('wa.me');
    expect(decodeURIComponent(btn.href)).toContain('Firulais');
    expect(decodeURIComponent(btn.href)).toContain('/publico/compartir/mascotas/1');
  });

  test('Los links abren en pestaña nueva (_blank)', () => {
    renderBotones();
    expect(screen.getByTestId('btn-facebook')).toHaveAttribute('target', '_blank');
    expect(screen.getByTestId('btn-whatsapp')).toHaveAttribute('target', '_blank');
  });

  test('Los links tienen rel noopener noreferrer por seguridad', () => {
    renderBotones();
    expect(screen.getByTestId('btn-facebook')).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByTestId('btn-whatsapp')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('Genera URLs distintas para mascotas distintas', () => {
    const { rerender } = renderBotones({ mascotaId: 5, nombreMascota: 'Luna' });
    const fb5 = screen.getByTestId('btn-facebook').href;

    rerender(
      <MemoryRouter>
        <BotonesCompartir mascotaId={99} nombreMascota="Rocky" />
      </MemoryRouter>
    );
    const fb99 = screen.getByTestId('btn-facebook').href;
    expect(fb5).not.toBe(fb99);
  });
});
