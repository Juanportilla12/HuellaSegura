import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import './index.css';
import App from './App';
import { ThemeProvider } from './providers/ThemeProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      {/* Respeta la preferencia del sistema de reducir animaciones */}
      <MotionConfig reducedMotion="user">
      {/* En pantallas grandes la app se muestra centrada como un teléfono */}
      <div className="min-h-dvh bg-warm-50 md:bg-[#EDE5E1] dark:bg-dark-900 md:flex md:items-start md:justify-center">
        <div className="w-full max-w-[430px] min-h-dvh relative overflow-hidden bg-warm-50 dark:bg-dark-800
                        md:shadow-[0_20px_60px_rgba(26,26,46,0.18)]">
          <App />
          <Toaster
            position="top-center"
            expand={false}
            richColors
            toastOptions={{
              style: { fontFamily: "'Inter', sans-serif", borderRadius: '1rem', fontSize: '0.875rem' },
              classNames: { toast: 'shadow-card-lg !border-warm-border' },
            }}
          />
        </div>
      </div>
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>
);
