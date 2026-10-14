// Aplicar tema antes del render para evitar flash.
// Light es el default. Dark solo si el usuario lo activó explícitamente en el app.
// Va en un archivo aparte (no en línea) para que la política CSP no necesite 'unsafe-inline'.
(function () {
  try {
    if (localStorage.getItem('hs-theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch { /* almacenamiento bloqueado: se queda el tema claro */ }
})();
