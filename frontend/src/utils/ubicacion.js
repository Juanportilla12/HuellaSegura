// Ubicación del dispositivo con respaldo. En iPhone el GPS preciso suele tardar más de
// 10 s bajo techo y fallaba; si no responde, se pide la ubicación aproximada (wifi o
// antena), que llega casi siempre en uno o dos segundos.

function pedir(opciones) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject,
      opciones
    );
  });
}

export async function obtenerUbicacion() {
  if (!navigator.geolocation) {
    const error = new Error('sin-geolocalizacion');
    error.code = 'NO_DISPONIBLE';
    throw error;
  }
  try {
    return await pedir({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  } catch (error) {
    if (error.code === 1) throw error; // permiso denegado: reintentar no sirve
    return pedir({ enableHighAccuracy: false, timeout: 20000, maximumAge: 5 * 60000 });
  }
}

const esIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const esNavegadorDeApp = () => /FBAN|FBAV|Instagram|WhatsApp|Line\//i.test(navigator.userAgent);

// Mensaje claro según la causa. Con `conMapa` se ofrece marcar el punto en el mapa.
export function mensajeErrorUbicacion(error, { conMapa = true } = {}) {
  const alternativa = conMapa ? ' Mientras tanto, toca el mapa para marcar el punto.' : '';
  if (error?.code === 'NO_DISPONIBLE') {
    return `Este navegador no permite obtener tu ubicación.${alternativa}`;
  }
  if (error?.code === 1) {
    if (esNavegadorDeApp()) {
      return `El navegador de esta app no da acceso a la ubicación: abre el enlace en Safari o Chrome.${alternativa}`;
    }
    if (esIOS()) {
      return `No hay permiso de ubicación. Actívalo en Ajustes › Privacidad y seguridad › Localización › Sitios web de Safari › "Al usar la app".${alternativa}`;
    }
    return `No hay permiso de ubicación. Actívalo en el candado junto a la dirección de la página.${alternativa}`;
  }
  return `No pudimos ubicarte (señal de GPS débil).${alternativa}`;
}

const esAndroid = () => /Android/i.test(navigator.userAgent);

// Pasos para activar el permiso de ubicación cuando el navegador lo tiene bloqueado.
// Una página web no puede abrir los Ajustes del teléfono (solo las apps instaladas
// pueden), así que se guía al usuario por el camino más corto en cada plataforma.
export function pasosActivarUbicacion() {
  if (esNavegadorDeApp()) {
    return {
      pasos: [
        'Toca el menú (⋯ o ⋮) de esta ventana.',
        'Elige "Abrir en Safari" o "Abrir en el navegador".',
        'Allí, cuando te pregunte, toca "Permitir".',
      ],
    };
  }
  if (esIOS()) {
    return {
      pasos: [
        'Toca el botón de menú junto a la dirección de la página (☰ o "aA").',
        'Entra a "Configuración del sitio web".',
        'En "Ubicación", elige "Permitir".',
      ],
      nota: 'Si no aparece la opción, ve a Ajustes del iPhone › Privacidad y seguridad › Localización (activada) › Sitios web de Safari › "Al usar la app".',
    };
  }
  if (esAndroid()) {
    return {
      pasos: [
        'Toca el ícono a la izquierda de la dirección de la página.',
        'Entra a "Permisos" o "Configuración del sitio".',
        'En "Ubicación", elige "Permitir".',
      ],
      nota: 'Revisa también que la ubicación del teléfono esté activada en el panel de accesos rápidos.',
    };
  }
  return {
    pasos: [
      'Haz clic en el ícono a la izquierda de la dirección de la página.',
      'En "Ubicación", elige "Permitir".',
    ],
  };
}
