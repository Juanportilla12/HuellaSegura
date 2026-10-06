import api from './api';

export function obtenerEstadisticas()       { return api.get('/admin/estadisticas'); }
export function listarUsuarios()            { return api.get('/admin/usuarios'); }
export function cambiarEstadoUsuario(id)    { return api.put(`/admin/usuarios/${id}/estado`); }
export function listarReportesAdmin()       { return api.get('/admin/reportes'); }
export function moderarReporte(id)          { return api.put(`/admin/reportes/${id}/moderar`); }
export function listarEntidades()           { return api.get('/entidades-aliadas'); }
export function crearEntidad(datos)         { return api.post('/entidades-aliadas', datos); }

// HU-30: el PDF requiere token, por eso se descarga como blob y no con window.open
export async function descargarReporteSemanal() {
  const { data } = await api.get('/admin/reportes/semanal-pdf', { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'reporte-semanal-huellasegura.pdf';
  enlace.click();
  URL.revokeObjectURL(url);
}
