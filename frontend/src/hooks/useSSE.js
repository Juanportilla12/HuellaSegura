import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useSSE(onEvento) {
  const { estaAutenticado } = useAuth();
  const esRef    = useRef(null);
  const cbRef    = useRef(onEvento);

  // Mantener la referencia del callback actualizada
  useEffect(() => { cbRef.current = onEvento; }, [onEvento]);

  const conectar = useCallback(() => {
    if (!estaAutenticado) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const url    = `${apiUrl}/sse/eventos`;

    // Añadir token como query param (EventSource no soporta headers)
    const es = new EventSource(`${url}?token=${token}`);
    esRef.current = es;

    es.addEventListener('avistamiento', (e) => {
      try { cbRef.current?.('avistamiento', JSON.parse(e.data)); } catch { /* evento mal formado: se ignora */ }
    });

    es.addEventListener('notificacion', (e) => {
      try { cbRef.current?.('notificacion', JSON.parse(e.data)); } catch { /* evento mal formado: se ignora */ }
    });

    es.onerror = () => {
      es.close();
      // Reconectar después de 5 s si falla
      setTimeout(conectar, 5000);
    };
  }, [estaAutenticado]);

  useEffect(() => {
    conectar();
    return () => { esRef.current?.close(); };
  }, [conectar]);
}
