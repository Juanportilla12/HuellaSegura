import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Map, Plus, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTokens } from '../../hooks/useTokens';
import { useNotificaciones } from '../../context/NotificacionesContext';

const NAV_ITEMS = [
  { to: '/',        icon: Home,  label: 'Inicio'  },
  { to: '/mapa',    icon: Map,   label: 'Mapa'    },
  { fab: true },
  { to: '/alertas', icon: Bell,  label: 'Alertas' },
  { to: '/perfil',  icon: User,  label: 'Perfil'  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const t        = useTokens();
  const { noLeidas } = useNotificaciones();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-40 pb-safe"
      style={{
        background: t.navBg,
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderTop: `1px solid ${t.navBorder}`,
        boxShadow: t.isDark ? '0 -8px 32px rgba(0,0,0,0.4)' : '0 -4px 24px rgba(249,123,98,0.08)',
      }}
      aria-label="Navegación principal"
    >
      <div className="flex items-center h-16">
        {NAV_ITEMS.map((item) => {
          if (item.fab) {
            return (
              <div key="fab" className="flex-1 flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => navigate('/reportes/nuevo')}
                  className="h-14 w-14 -mt-6 rounded-full flex items-center justify-center text-white relative"
                  style={{
                    background: 'linear-gradient(135deg,#FF9280,#F97B62)',
                    boxShadow: '0 8px 28px rgba(249,123,98,0.6), 0 0 0 4px rgba(249,123,98,0.15)',
                    animation: 'glow 2.5s ease-in-out infinite',
                  }}
                  aria-label="Crear nuevo reporte"
                >
                  <Plus size={26} strokeWidth={2.5} />
                </motion.button>
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
              aria-label={item.label}
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="relative"
                  >
                    {isActive ? (
                      <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
                           style={{ background: t.primaryBg }}>
                        <Icon size={20} strokeWidth={2.2} style={{ color: t.primary }} />
                      </div>
                    ) : (
                      <Icon size={20} strokeWidth={1.8} style={{ color: t.textMuted }} />
                    )}
                    {item.to === '/alertas' && noLeidas > 0 && (
                      <span
                        data-testid="nav-badge-alertas"
                        className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full border-2 text-[10px] font-bold text-white flex items-center justify-center"
                        style={{ background: t.primary, borderColor: t.bg }}
                        aria-label={`${noLeidas} notificaciones sin leer`}
                      >
                        {noLeidas > 9 ? '9+' : noLeidas}
                      </span>
                    )}
                  </motion.div>
                  <span className="text-[10px] font-semibold transition-colors duration-200"
                        style={{ color: isActive ? t.primary : t.textMuted }}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
