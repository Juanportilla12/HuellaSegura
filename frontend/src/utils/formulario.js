import { toast } from 'sonner';

// Lleva al usuario al primer campo con error después de un envío fallido.
// Los formularios largos tienen el botón fijo abajo: sin esto el error queda fuera
// de la pantalla y parece que el botón no hizo nada.
export function mostrarPrimerError(mensaje = 'Completa los campos obligatorios marcados en rojo.') {
  toast.error(mensaje);
  requestAnimationFrame(() => {
    const campo = document.querySelector('[aria-invalid="true"], [data-error="true"]');
    if (!campo) return;
    campo.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    if (typeof campo.focus === 'function') campo.focus({ preventScroll: true });
  });
}

export const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Mismo formato que acepta el backend: 7 a 15 dígitos, con + inicial y un espacio o guion opcional entre dígitos
export const CELULAR_REGEX = /^\+?[0-9](?:[\s-]?[0-9]){6,14}$/;
