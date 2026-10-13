import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Megaphone, Eye, House, ChevronRight, ShieldAlert, Stethoscope, FileDown, RotateCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { obtenerEstadisticas, descargarReporteSemanal } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { focoVisible } from '../../components/auth/AuthUI';

// Métricas reales del backend (sin tendencias ni metas inventadas)
const METRICAS = [
  { key: 'total_usuarios',     label: 'Usuarios activos',     icon: Users },
  { key: 'reportes_activos',   label: 'Búsquedas activas',    icon: Megaphone },
  { key: 'avistamientos_mes',  label: 'Avistamientos del mes', icon: Eye },
  { key: 'reportes_resueltos', label: 'Mascotas encontradas', icon: House, exito: true },
];

const ACCESOS = [
  { to: '/admin/usuarios', icon: Users,       label: 'Gestión de usuarios',     desc: 'Activar o desactivar cuentas' },
  { to: '/admin/reportes', icon: ShieldAlert, label: 'Moderación de reportes',  desc: 'Ocultar contenido inapropiado' },
  { to: '/directorio',     icon: Stethoscope, label: 'Directorio de aliados',   desc: 'Veterinarias y albergues' },
];

function Metrica({ cfg, valor, cargando }) {
  const Icon = cfg.icon;
  return (
    <div data-testid="stat-card"
      className="rounded-3xl p-4 flex flex-col gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
      <span className={`h-10 w-10 rounded-xl flex items-center justify-center
                        ${cfg.exito ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    : 'bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-primary-400'}`}>
        <Icon size={20} aria-hidden="true" />
      </span>
      {cargando
        ? <span className="h-8 w-14 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse" aria-hidden="true" />
        : <span className="font-poppins font-bold text-[28px] leading-none text-dark-900 dark:text-white">{valor ?? 0}</span>}
      <span className="text-[13px] font-medium text-gray-500 dark:text-white/50">{cfg.label}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(false);
    obtenerEstadisticas()
      .then(({ data }) => setStats(data.estadisticas))
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function descargarPDF() {
    setDescargando(true);
    try { await descargarReporteSemanal(); }
    catch { toast.error('No se pudo generar el PDF.'); }
    finally { setDescargando(false); }
  }

  const total = stats?.total_reportes ?? 0;
  const resueltos = stats?.reportes_resueltos ?? 0;
  const tasa = total > 0 ? Math.round((resueltos / total) * 100) : 0;

  return (
    <div className="min-h-dvh bg-warm-50 dark:bg-dark-800 pb-10">
      <header className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-primary-700 dark:text-primary-400">Panel del equipo</p>
          <h1 className="font-poppins font-bold text-[26px] leading-tight text-dark-900 dark:text-white">Administración</h1>
          <p className="text-[14px] text-gray-500 dark:text-white/50">Hola, {usuario?.nombre?.split(' ')[0] || 'equipo'}</p>
        </div>
        <button type="button" onClick={() => navigate('/')}
          className={`h-10 px-3.5 shrink-0 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-dark-700
                      bg-white border border-warm-border dark:bg-white/10 dark:border-white/10 dark:text-white ${focoVisible}`}>
          <Smartphone size={16} aria-hidden="true" /> Ir a la app
        </button>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-6">
        {error && (
          <div className="rounded-3xl p-4 flex items-center gap-3 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
            <p role="alert" className="flex-1 text-[14px] text-red-700 dark:text-red-300">No se pudieron cargar las estadísticas.</p>
            <button type="button" onClick={cargar}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold text-primary-700 bg-primary-50 ${focoVisible}`}>
              <RotateCw size={15} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        <section aria-label="Métricas">
          <div className="grid grid-cols-2 gap-3">
            {METRICAS.map((cfg) => <Metrica key={cfg.key} cfg={cfg} valor={stats?.[cfg.key]} cargando={cargando} />)}
          </div>
        </section>

        <section aria-labelledby="titulo-tasa" className="rounded-3xl p-5 bg-white dark:bg-white/5 border border-warm-border dark:border-white/10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="titulo-tasa" className="font-poppins font-semibold text-[16px] text-dark-900 dark:text-white">Tasa de reencuentro</h2>
              <p className="text-[13px] text-gray-500 dark:text-white/50">Reportes que terminaron con la mascota en casa</p>
            </div>
            <span className="font-poppins font-bold text-[28px] leading-none text-emerald-600 dark:text-emerald-400">{tasa}%</span>
          </div>
          <div className="mt-4 h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden" role="progressbar"
               aria-valuenow={tasa} aria-valuemin={0} aria-valuemax={100} aria-label="Tasa de reencuentro">
            <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-700" style={{ width: `${tasa}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-gray-500 dark:text-white/40">
            {resueltos} de {total} {total === 1 ? 'reporte' : 'reportes'} en total
          </p>
        </section>

        <section aria-label="Herramientas">
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10
                          divide-y divide-warm-border dark:divide-white/10">
            {ACCESOS.map(({ to, icon: Icon, label, desc }) => (
              <button key={to} type="button" onClick={() => navigate(to)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-warm-50 dark:hover:bg-white/5 ${focoVisible}`}>
                <span className="h-10 w-10 shrink-0 rounded-xl bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-primary-400
                                 flex items-center justify-center">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-dark-900 dark:text-white">{label}</span>
                  <span className="block text-[13px] text-gray-500 dark:text-white/50">{desc}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <button type="button" onClick={descargarPDF} disabled={descargando}
          className={`h-12 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-semibold text-dark-900
                      bg-white border-[1.5px] border-gray-300 hover:bg-gray-50 disabled:opacity-60
                      dark:bg-white/5 dark:border-white/15 dark:text-white ${focoVisible}`}>
          <FileDown size={18} aria-hidden="true" /> {descargando ? 'Generando PDF…' : 'Descargar reporte semanal (PDF)'}
        </button>
      </div>
    </div>
  );
}
