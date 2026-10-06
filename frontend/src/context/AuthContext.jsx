import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar, rehydrata la sesión desde localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    if (token && usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
    setCargando(false);

    // Refresca los datos del usuario desde el servidor (p. ej. alertas_activas)
    if (token) {
      authService.getMe()
        .then(({ data }) => {
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
          setUsuario(data.usuario);
        })
        .catch(() => {});
    }
  }, []);

  const login = useCallback(async (email, password, turnstileToken = '') => {
    const { data } = await authService.login(email, password, turnstileToken);
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data;
  }, []);

  const register = useCallback(async (datos) => {
    const { data } = await authService.register(datos);
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Si el token ya expiró no importa, limpiamos igual
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setUsuario(null);
    }
  }, []);

  const actualizarUsuario = useCallback((cambios) => {
    setUsuario(prev => {
      const actualizado = { ...prev, ...cambios };
      localStorage.setItem('usuario', JSON.stringify(actualizado));
      return actualizado;
    });
  }, []);

  const value = {
    usuario,
    cargando,
    estaAutenticado: !!usuario,
    esAdmin: usuario?.rol === 'admin',
    login,
    register,
    logout,
    actualizarUsuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
