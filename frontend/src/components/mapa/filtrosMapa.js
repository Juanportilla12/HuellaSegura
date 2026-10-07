export const EMOJIS = { perro: '🐶', gato: '🐱', ave: '🐦', reptil: '🦎', otro: '🐾' };

export const FILTRO_ESPECIE = [
  { id: 'todos',  label: 'Todos',    emoji: '🐾' },
  { id: 'perro',  label: 'Perros',   emoji: '🐕' },
  { id: 'gato',   label: 'Gatos',    emoji: '🐈' },
  { id: 'ave',    label: 'Aves',     emoji: '🐦' },
  { id: 'reptil', label: 'Reptiles', emoji: '🦎' },
];

export const FILTRO_TIEMPO = [
  { id: 'todos', label: 'Cualquier fecha'  },
  { id: '1h',    label: 'Última 1 hora'    },
  { id: '24h',   label: 'Últimas 24 horas' },
  { id: '7d',    label: 'Última semana'    },
];

const MINUTOS = { '1h': 60, '24h': 1440, '7d': 10080 };

function dentroDeRango(fecha, rango) {
  if (!fecha || rango === 'todos') return true;
  return (Date.now() - new Date(fecha)) / 60000 <= MINUTOS[rango];
}

// R10 / HU-14: filtra reportes por especie, antigüedad y texto (nombre o raza)
export function filtrarReportes(reportes, { especie, tiempo, texto }) {
  const q = (texto || '').trim().toLowerCase();
  return reportes.filter((r) => {
    if (especie !== 'todos' && r.mascota?.especie !== especie) return false;
    if (!dentroDeRango(r.created_at, tiempo)) return false;
    if (q) {
      const nombre = (r.mascota?.nombre || '').toLowerCase();
      const raza = (r.mascota?.raza || '').toLowerCase();
      if (!nombre.includes(q) && !raza.includes(q)) return false;
    }
    return true;
  });
}

export function tiempoTranscurrido(fecha) {
  if (!fecha) return '?';
  const mins = Math.floor((Date.now() - new Date(fecha)) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
