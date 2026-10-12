// Indicador de carga (pantalla completa mientras se descarga una pantalla diferida, o en línea)
export default function LoadingSpinner({ fullScreen = false, label }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label || 'Cargando'}>
      <span className="h-9 w-9 rounded-full border-[3px] border-primary-700 border-t-transparent animate-spin" aria-hidden="true" />
      {label && <p className="text-sm font-medium text-gray-500 dark:text-white/50">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-50 dark:bg-dark-800">
        {spinner}
      </div>
    );
  }
  return spinner;
}
