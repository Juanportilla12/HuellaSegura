import api from './api';

// HU-27: directorio de entidades aliadas (lectura pública, gestión solo admin)
export function listarEntidades()            { return api.get('/entidades-aliadas'); }
export function crearEntidad(datos)          { return api.post('/entidades-aliadas', datos); }
export function actualizarEntidad(id, datos) { return api.put(`/entidades-aliadas/${id}`, datos); }
export function eliminarEntidad(id)          { return api.delete(`/entidades-aliadas/${id}`); }
