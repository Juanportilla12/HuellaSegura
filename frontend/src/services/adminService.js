import api, { descargarArchivo } from './api';

export function obtenerEstadisticas()       { return api.get('/admin/estadisticas'); }
export function listarUsuarios()            { return api.get('/admin/usuarios'); }
export function cambiarEstadoUsuario(id)    { return api.put(`/admin/usuarios/${id}/estado`); }
export function listarReportesAdmin()       { return api.get('/admin/reportes'); }
export function moderarReporte(id)          { return api.put(`/admin/reportes/${id}/moderar`); }

// HU-30: el PDF requiere token, por eso se descarga como blob y no con window.open
export function descargarReporteSemanal() {
  return descargarArchivo('/admin/reportes/semanal-pdf', 'reporte-semanal-huellasegura.pdf');
}
