export const FILTRO_ESPECIE = [
  { id: 'todos',  label: 'Todos'    },
  { id: 'perro',  label: 'Perros'   },
  { id: 'gato',   label: 'Gatos'    },
  { id: 'ave',    label: 'Aves'     },
  { id: 'reptil', label: 'Reptiles' },
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

// Versión para mostrar al usuario: "hace 5 min", "hace 3 h", "hace 2 días"
export function tiempoLegible(fecha) {
  if (!fecha) return '';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(fecha)) / 60000));
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const dias = Math.floor(hrs / 24);
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
}
