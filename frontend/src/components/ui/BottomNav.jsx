import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Map, Plus, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const { noLeidas } = useNotificaciones();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-40 pb-[env(safe-area-inset-bottom)]
                 bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl border-t border-warm-border dark:border-white/10
                 shadow-[0_-4px_20px_rgba(26,26,46,0.06)]"
      aria-label="Navegación principal"
    >
      <div className="flex items-center h-16">
        {NAV_ITEMS.map((item) => {
          if (item.fab) {
            return (
              <div key="fab" className="flex-1 flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => navigate('/reportes/nuevo')}
                  className="h-14 w-14 -mt-6 rounded-full flex items-center justify-center text-white relative
                             bg-primary-700 ring-4 ring-white dark:ring-dark-800 shadow-[0_8px_20px_rgba(204,74,52,0.4)]
                             focus-visible:outline-none focus-visible:ring-primary/40"
                  aria-label="Reportar mascota perdida"
                >
                  <Plus size={26} strokeWidth={2.5} aria-hidden="true" />
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
              className="relative flex-1 h-full flex flex-col items-center justify-center gap-1 rounded-xl
                         focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/30"
              aria-label={item.to === '/alertas' && noLeidas > 0 ? `${item.label}, ${noLeidas} sin leer` : item.label}
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true"
                          className={isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-white/50'} />
                    {item.to === '/alertas' && noLeidas > 0 && (
                      <span
                        data-testid="nav-badge-alertas"
                        className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white
                                   bg-primary-700 ring-2 ring-white dark:ring-dark-800 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        {noLeidas > 9 ? '9+' : noLeidas}
                      </span>
                    )}
                  </span>
                  <span className={`text-[11px] font-semibold ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-white/50'}`}>
                    {item.label}
                  </span>
                  {isActive && <motion.span layoutId="nav-activo" className="absolute top-0 h-[3px] w-8 rounded-full bg-primary-700" aria-hidden="true" />}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
