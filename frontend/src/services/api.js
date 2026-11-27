import axios from 'axios';

// VITE_API_URL debe terminar en /api; si se configuró sin él (o con barra final) se corrige
function urlApi() {
  const url = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').trim().replace(/\/+$/, '');
  return url.endsWith('/api') ? url : `${url}/api`;
}

export const API_URL = urlApi();

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Sin límite, una petición colgada dejaba el botón cargando para siempre
  timeout: 60000,
});

// Adjunta el token JWT automáticamente en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rutas donde un 401 significa "datos incorrectos" y no "sesión vencida"
const RUTAS_SIN_SESION = [
  '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/verify-reset-code', '/auth/reset-password',
  '/auth/verificar-correo', '/auth/reenviar-verificacion', '/auth/no-fui-yo',
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;

    // Toda respuesta de error lleva un `message` legible: los errores de validación
    // del servidor llegan como lista y se toma el primero.
    if (data && typeof data === 'object' && !data.message && data.errors?.[0]?.msg) {
      data.message = data.errors[0].msg;
    }
    if (!error.response) {
      error.response = {
        data: {
          message: error.code === 'ECONNABORTED'
            ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
            : 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.',
        },
      };
    }

    // Sesión vencida o cerrada en otro dispositivo: se vuelve al inicio de sesión.
    // En el propio login un 401 es "contraseña incorrecta" y no debe recargar la página.
    const ruta = error.config?.url || '';
    const teniaSesion = Boolean(error.config?.headers?.Authorization);
    if (error.response.status === 401 && teniaSesion && !RUTAS_SIN_SESION.some((r) => ruta.startsWith(r))) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Descarga un archivo protegido (PDF, PNG) con el token JWT y lo guarda en el dispositivo
export async function descargarArchivo(ruta, nombreArchivo) {
  const { data } = await api.get(ruta, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}

export default api;
