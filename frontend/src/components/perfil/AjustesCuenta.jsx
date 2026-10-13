import { useState } from 'react';
import { Bell, Moon, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../providers/ThemeProvider';
import * as usuarioService from '../../services/usuarioService';
import Interruptor from '../ui/Interruptor';
import { focoVisible, inputAuth } from '../auth/AuthUI';

// Grupo de ajustes con título, al estilo de las apps nativas
export function Grupo({ titulo, children }) {
  return (
    <section className="mx-4" aria-label={titulo}>
      <h2 className="px-1 mb-2 text-[13px] font-semibold text-gray-500 dark:text-white/50">{titulo}</h2>
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-warm-border dark:border-white/10
                      divide-y divide-warm-border dark:divide-white/10">
        {children}
      </div>
    </section>
  );
}

export function IconoFila({ icon: Icon, tono = 'primario' }) {
  const tonos = {
    primario: 'bg-primary-50 text-primary-700 dark:bg-white/10 dark:text-primary-400',
    neutro:   'bg-gray-100 text-dark-700 dark:bg-white/10 dark:text-white/80',
  };
  return (
    <span className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${tonos[tono]}`}>
      <Icon size={20} aria-hidden="true" />
    </span>
  );
}

// R8/R9 + Ley 1581: la ubicación solo se guarda con el consentimiento explícito del usuario
function AjusteAlertas() {
  const { usuario, actualizarUsuario } = useAuth();
  const [cambiando, setCambiando] = useState(false);
  const activas = Boolean(usuario?.alertas_activas);

  async function cambiar(activar) {
    setCambiando(true);
    try {
      if (activar) {
        const pos = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) reject(new Error('sin-geo'));
          else navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        await usuarioService.actualizarUbicacion(pos.coords.latitude, pos.coords.longitude);
        toast.success('Alertas activadas. Te avisaremos de mascotas perdidas cerca de ti.');
      } else {
        await usuarioService.desactivarUbicacion();
        toast.success('Alertas desactivadas. Tu ubicación fue eliminada.');
      }
      actualizarUsuario({ alertas_activas: activar });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo obtener tu ubicación. Revisa los permisos del navegador.');
    } finally {
      setCambiando(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <IconoFila icon={Bell} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-dark-900 dark:text-white">Alertas cerca de mí</p>
        <p className="text-[13px] text-gray-500 dark:text-white/50">
          {activas ? 'Activas: usamos tu ubicación para avisarte' : 'Comparte tu ubicación para recibir avisos'}
        </p>
      </div>
      <Interruptor etiqueta="Alertas por proximidad" activo={activas} deshabilitado={cambiando} onCambio={cambiar} />
    </div>
  );
}

// HU-19: radio de alertas configurable entre 1 y 10 km
function AjusteRadio() {
  const { usuario, actualizarUsuario } = useAuth();
  const [radio, setRadio] = useState(usuario?.radio_alerta || 5);
  const [guardando, setGuardando] = useState(false);
  const cambiado = radio !== (usuario?.radio_alerta || 5);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await usuarioService.actualizarRadioAlerta(radio);
      actualizarUsuario?.({ radio_alerta: radio });
      toast.success(`Radio actualizado a ${radio} km.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar el radio.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="px-4 py-4">
      <div className="flex items-center justify-between">
        <label htmlFor="radio-alerta" className="text-[15px] font-semibold text-dark-900 dark:text-white">Distancia de las alertas</label>
        <span className="text-[14px] font-bold text-primary-700 dark:text-primary-400">{radio} km</span>
      </div>
      <input id="radio-alerta" type="range" min={1} max={10} step={1} value={radio}
        onChange={(e) => setRadio(parseInt(e.target.value, 10))} data-testid="slider-radio"
        aria-valuetext={`${radio} kilómetros`}
        className="w-full mt-3 accent-primary-700 h-2 cursor-pointer" />
      <div className="flex justify-between text-[12px] text-gray-500 dark:text-white/40 mt-1">
        <span>1 km</span><span>5 km</span><span>10 km</span>
      </div>
      <button type="submit" data-testid="btn-guardar-radio" disabled={guardando}
        className={`mt-3 w-full h-11 rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-60 ${focoVisible}
                    ${cambiado ? 'text-white bg-primary-700 hover:bg-primary-800'
                               : 'text-primary-700 bg-primary-50 dark:bg-white/10 dark:text-primary-400'}`}>
        {guardando ? 'Guardando…' : 'Guardar distancia'}
      </button>
    </form>
  );
}

// R1: celular de contacto que se muestra en el perfil público de las mascotas
function AjusteCelular() {
  const { usuario, actualizarUsuario } = useAuth();
  const [celular, setCelular] = useState(usuario?.celular || '');
  const [guardando, setGuardando] = useState(false);
  const cambiado = celular.trim() !== (usuario?.celular || '');

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const { data } = await usuarioService.actualizarPerfil({ celular: celular.trim() });
      actualizarUsuario({ celular: data.usuario.celular });
      toast.success('Celular actualizado.');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'No se pudo actualizar el celular.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="px-4 py-4">
      <div className="flex items-center gap-3">
        <IconoFila icon={Phone} />
        <div>
          <label htmlFor="celular-perfil" className="block text-[15px] font-semibold text-dark-900 dark:text-white">Celular</label>
          <p className="text-[13px] text-gray-500 dark:text-white/50">Lo verá quien encuentre a tu mascota</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <input id="celular-perfil" type="tel" inputMode="tel" autoComplete="tel" value={celular}
          onChange={(e) => setCelular(e.target.value)} placeholder="300 123 4567" data-testid="input-celular"
          className={`${inputAuth(false)} !pl-4 pr-4 !h-12`} />
        <button type="submit" disabled={guardando || !cambiado}
          className={`shrink-0 h-12 px-4 rounded-2xl text-[14px] font-semibold text-white bg-primary-700 hover:bg-primary-800
                      disabled:opacity-40 ${focoVisible}`}>
          {guardando ? '…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function AjusteTema() {
  const { isDark, toggleTheme } = useThemeContext();
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <IconoFila icon={Moon} tono="neutro" />
      <p className="flex-1 text-[15px] font-semibold text-dark-900 dark:text-white">Modo oscuro</p>
      <Interruptor etiqueta="Modo oscuro" activo={isDark} onCambio={toggleTheme} />
    </div>
  );
}

// Ajustes de la cuenta agrupados por tema
export default function AjustesCuenta() {
  return (
    <>
      <Grupo titulo="Alertas">
        <AjusteAlertas />
        <AjusteRadio />
      </Grupo>
      <Grupo titulo="Contacto">
        <AjusteCelular />
      </Grupo>
      <Grupo titulo="Apariencia">
        <AjusteTema />
      </Grupo>
    </>
  );
}
