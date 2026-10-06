// Notificaciones en tiempo real mediante Server-Sent Events (SSE).
// Cada usuario puede tener varias pestañas abiertas: usuarioId -> Set<res>
const clientes = new Map();

function registrarCliente(usuarioId, res) {
  const id = String(usuarioId);
  if (!clientes.has(id)) clientes.set(id, new Set());
  clientes.get(id).add(res);
}

function eliminarCliente(usuarioId, res) {
  const id = String(usuarioId);
  const conexiones = clientes.get(id);
  if (!conexiones) return;
  conexiones.delete(res);
  if (conexiones.size === 0) clientes.delete(id);
}

function enviarEvento(res, evento, datos) {
  res.write(`event: ${evento}\n`);
  res.write(`data: ${JSON.stringify(datos)}\n\n`);
}

// Envía un evento a todas las conexiones abiertas de un usuario
function notificarUsuario(usuarioId, evento, datos) {
  const conexiones = clientes.get(String(usuarioId));
  if (!conexiones) return;
  conexiones.forEach((res) => enviarEvento(res, evento, datos));
}

module.exports = { registrarCliente, eliminarCliente, enviarEvento, notificarUsuario };
