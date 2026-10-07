import { useState } from 'react';
import { Bell, MapPin, Moon, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useTokens } from '../../hooks/useTokens';
import { useThemeContext } from '../../providers/ThemeProvider';
import * as usuarioService from '../../services/usuarioService';
import Interruptor from '../ui/Interruptor';

const CORAL = 'linear-gradient(135deg,#FF9280,#F97B62)';

function Fila({ icono: Icono, color, fondo, titulo, descripcion, children, ultima = false }) {
  const t = useTokens();
  return (
    <div className="flex items-center gap-4 px-5 py-4" style={ultima ? {} : { borderBottom: `1px solid ${t.border}` }}>
      <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: fondo }}>
        <Icono size={18} style={{ color }} />
      </span>
      <div className="flex-1 min-w-0">
        <span className="block font-medium text-[15px]" style={{ color: t.text }}>{titulo}</span>
        {descripcion && <span className="block text-xs" style={{ color: t.textMuted }}>{descripcion}</span>}
      </div>
      {children}
    </div>
  );
}

// R8/R9 + Ley 1581: la ubicación solo se guarda con el consentimiento explícito del usuario
function AjusteAlertas() {
  const t = useTokens();
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
    <Fila icono={Bell} color={t.primary} fondo={t.primaryBg} titulo="Alertas por proximidad"
          descripcion="Comparte tu ubicación para recibir avisos de mascotas perdidas cerca de ti.">
      <Interruptor etiqueta="Alertas por proximidad" activo={activas} deshabilitado={cambiando} onCambio={cambiar} />
    </Fila>
  );
}

// R1: celular de contacto que se muestra en el perfil público de las mascotas
function AjusteCelular() {
  const t = useTokens();
  const { usuario, actualizarUsuario } = useAuth();
  const [celular, setCelular] = useState(usuario?.celular || '');
  const [guardando, setGuardando] = useState(false);

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
    <form onSubmit={guardar} className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}>
      <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.accentBg }}>
        <Phone size={18} style={{ color: t.accent }} />
      </span>
      <label htmlFor="celular-perfil" className="sr-only">Celular</label>
      <input id="celular-perfil" type="tel" value={celular} onChange={(e) => setCelular(e.target.value)}
        placeholder="Celular · 300 123 4567" data-testid="input-celular"
        className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.inputBorder}` }} />
      <button type="submit" disabled={guardando} className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: CORAL, opacity: guardando ? 0.7 : 1 }}>
        {guardando ? '…' : 'Guardar'}
      </button>
    </form>
  );
}

// HU-19: radio de alertas configurable entre 1 y 10 km
function AjusteRadio() {
  const t = useTokens();
  const { usuario, actualizarUsuario } = useAuth();
  const [radio, setRadio] = useState(usuario?.radio_alerta || 5);
  const [guardando, setGuardando] = useState(false);

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
    <div style={{ borderBottom: `1px solid ${t.border}` }}>
      <div className="flex items-center gap-4 px-5 pt-4 pb-2">
        <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.secondaryBg }}>
          <MapPin size={18} style={{ color: t.secondary }} />
        </span>
        <label htmlFor="radio-alerta" className="flex-1 font-medium text-[15px]" style={{ color: t.text }}>Alertas por radio</label>
        <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ background: t.secondaryBg, color: t.secondary }}>
          {radio} km
        </span>
      </div>
      <form onSubmit={guardar} className="px-5 pb-4">
        <input id="radio-alerta" type="range" className="w-full mb-1" min={1} max={10} step={1} value={radio}
          onChange={(e) => setRadio(parseInt(e.target.value, 10))} style={{ accentColor: t.primary }}
          data-testid="slider-radio" />
        <div className="flex justify-between text-xs mb-3" style={{ color: t.textMuted }}>
          <span>1 km</span><span>5 km</span><span>10 km</span>
        </div>
        <button type="submit" data-testid="btn-guardar-radio" disabled={guardando}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
          style={{ background: CORAL, opacity: guardando ? 0.7 : 1 }}>
          {guardando ? 'Guardando…' : 'Guardar radio'}
        </button>
      </form>
    </div>
  );
}

function AjusteTema() {
  const t = useTokens();
  const { isDark, toggleTheme } = useThemeContext();
  return (
    <Fila icono={Moon} color={isDark ? '#C7B2F5' : '#6B7280'} fondo={t.surface2} titulo="Modo oscuro" ultima>
      <Interruptor etiqueta="Modo oscuro" activo={isDark} onCambio={toggleTheme} />
    </Fila>
  );
}

// Panel "Configuración" del perfil
export default function AjustesCuenta() {
  const t = useTokens();
  return (
    <section className="mx-4 mb-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: t.textMuted }}>Configuración</h3>
      <div className="rounded-3xl overflow-hidden" style={{ background: t.surface, boxShadow: t.shadowSm }}>
        <AjusteAlertas />
        <AjusteCelular />
        <AjusteRadio />
        <AjusteTema />
      </div>
    </section>
  );
}
