import { CampoAuth, inputAuth } from '../auth/AuthUI';

const SinIcono = () => null;

// Campo de texto con ícono, etiqueta visible y mensaje de error (mismo estilo que el inicio de sesión)
export default function CampoTexto({ id, etiqueta, icono, error, ...props }) {
  return (
    <CampoAuth id={id} label={etiqueta} icon={icono ?? SinIcono} error={error}>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props}
        className={`${inputAuth(error)} pr-4 ${icono ? '' : '!pl-4'}`} />
    </CampoAuth>
  );
}
