// Id del usuario con sesión iniciada (o null). Se lee del almacenamiento para poder
// usarlo también en pantallas públicas, que no dependen del contexto de sesión.
export function usuarioActualId() {
  try {
    if (!localStorage.getItem('token')) return null;
    return JSON.parse(localStorage.getItem('usuario') || 'null')?.id ?? null;
  } catch {
    return null;
  }
}

// ¿El reporte es de una mascota del usuario actual?
export function esReportePropio(reporte) {
  const id = usuarioActualId();
  return id != null && reporte?.usuario_id === id;
}
