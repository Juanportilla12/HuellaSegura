import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../src/pages/Login';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

// Turnstile no carga en jsdom: se simula una verificación exitosa inmediata
vi.mock('@marsidev/react-turnstile', async () => {
  const { useEffect } = await import('react');
  return {
    Turnstile: ({ onSuccess }) => {
      useEffect(() => { onSuccess('token-prueba'); }, []);
      return <div data-testid="turnstile" />;
    },
  };
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza el formulario con campos correo y contraseña', () => {
    renderLogin();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('muestra error si se envía el formulario vacío', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    // El error se muestra como texto en la UI (puede ser via alert role o text)
    await waitFor(() => {
      const alertEl = screen.queryByRole('alert');
      const textEl  = screen.queryByText(/completa|obligatorio/i);
      expect(alertEl || textEl).toBeTruthy();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('llama a login con las credenciales correctas', async () => {
    mockLogin.mockResolvedValueOnce({});
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('ana@example.com', 'password123', 'token-prueba');
    });
  });

  test('redirige al home tras login exitoso', async () => {
    mockLogin.mockResolvedValueOnce({});
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  test('muestra mensaje de error si las credenciales son incorrectas', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Correo o contraseña incorrectos.' } },
    });
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });

  test('deshabilita el botón durante la carga', async () => {
    mockLogin.mockImplementationOnce(() => new Promise(() => {})); // never resolves
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ingresando|iniciar sesión|cargando/i })).toBeDisabled();
    });
  });
});
