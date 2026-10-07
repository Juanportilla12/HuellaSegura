import { useTokens } from '../../hooks/useTokens';

// Conteos reales del usuario: mascotas, reportes y mascotas encontradas
export default function EstadisticasPerfil({ mascotas, reportes }) {
  const t = useTokens();
  const datos = [
    { valor: mascotas.length, etiqueta: 'MASCOTAS', color: t.primary },
    { valor: reportes.length, etiqueta: 'REPORTES', color: t.text },
    { valor: reportes.filter((r) => r.estado === 'encontrada').length, etiqueta: 'ENCONTRADAS', color: t.secondary },
  ];

  return (
    <div className="mx-4 rounded-3xl p-4 mb-5 grid grid-cols-3" style={{ background: t.surface, boxShadow: t.shadowSm }}>
      {datos.map(({ valor, etiqueta, color }, i) => (
        <div key={etiqueta} className="flex flex-col items-center py-1"
             style={i < 2 ? { borderRight: `1px solid ${t.border}` } : {}}>
          <span className="text-2xl font-poppins font-extrabold" style={{ color }}>{valor}</span>
          <span className="text-[10px] font-bold tracking-wider mt-0.5" style={{ color: t.textMuted }}>{etiqueta}</span>
        </div>
      ))}
    </div>
  );
}
