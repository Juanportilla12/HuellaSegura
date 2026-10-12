// Conteos reales del usuario: mascotas, reportes y mascotas encontradas
export default function EstadisticasPerfil({ mascotas, reportes }) {
  const datos = [
    { valor: mascotas.length, etiqueta: 'Mascotas' },
    { valor: reportes.length, etiqueta: 'Reportes' },
    { valor: reportes.filter((r) => r.estado === 'encontrada').length, etiqueta: 'Encontradas', exito: true },
  ];

  return (
    <dl className="mx-4 rounded-3xl py-3 grid grid-cols-3 divide-x divide-warm-border dark:divide-white/10
                   bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
      {datos.map(({ valor, etiqueta, exito }) => (
        <div key={etiqueta} className="flex flex-col-reverse items-center py-1">
          <dt className="text-[12px] font-medium text-gray-500 dark:text-white/50">{etiqueta}</dt>
          <dd className={`font-poppins font-bold text-[22px] leading-tight
                          ${exito && valor > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-dark-900 dark:text-white'}`}>
            {valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}
