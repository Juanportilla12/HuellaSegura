# Despliegue

Arquitectura de producción: **frontend en Vercel**, **backend y MySQL en Railway**, archivos en **Cloudinary**, correo por **Gmail SMTP**. Todos tienen plan gratuito suficiente para el prototipo y sirven HTTPS (RNF-04).

## 1. Base de datos (Railway)

1. En Railway: *New Project → Database → MySQL*.
2. Copia las variables `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER` y `MYSQLPASSWORD`; se usan en el backend como `DB_*`.

## 2. Backend (Railway)

1. *New → GitHub Repo* → selecciona el repositorio y define **Root Directory = `backend`**.
2. Railway lee `backend/railway.json`:
   - build con Railpack (`npm install`);
   - arranque: `npm run migrate && npm start` (aplica las migraciones pendientes y luego inicia);
   - verificación de salud: `GET /health`.
3. Variables del servicio (*Variables*):

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Datos del MySQL de Railway (se pueden referenciar como `${{MySQL.MYSQLHOST}}`, etc.) |
| `JWT_SECRET` | Cadena aleatoria nueva, de 64 o más caracteres |
| `JWT_EXPIRES_IN` | `24h` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Panel de Cloudinary |
| `EMAIL_HOST` / `EMAIL_PORT` | `smtp.gmail.com` / `587` |
| `EMAIL_USER` / `EMAIL_PASS` | Cuenta de Gmail y **contraseña de aplicación** |
| `TURNSTILE_SECRET_KEY` | Clave secreta de Cloudflare Turnstile |
| `FRONTEND_URL` | URL de Vercel, sin `/` al final |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOMBRE` | Administrador inicial (se crea si no existe) |

No definas `PORT`: Railway lo asigna. El servidor no arranca si falta una variable obligatoria y el log lo indica.

4. *Settings → Networking → Generate Domain* para obtener la URL pública de la API.

> Usa siempre credenciales nuevas: las anteriores quedaron expuestas en el historial del repositorio original.

## 3. Frontend (Vercel)

1. *Add New → Project* → el mismo repositorio, **Root Directory = `frontend`**.
2. Vercel detecta Vite y usa `frontend/vercel.json` (build `npm run build`, salida `dist`, reescritura de rutas a `index.html`).
3. Variables de entorno:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://<dominio-railway>/api` |
| `VITE_TURNSTILE_SITE_KEY` | Clave pública de Turnstile |

4. Después del primer despliegue, actualiza `FRONTEND_URL` en Railway con el dominio de Vercel (CORS, enlaces de los correos y QR).
5. En Cloudflare Turnstile agrega el dominio de Vercel a los dominios permitidos del widget.

## 4. Verificación posterior al despliegue

| Verificación | Cómo |
|---|---|
| API en línea | `GET https://<api>/health` → `{"status":"ok","env":"production"}` |
| Migraciones | En el log de Railway: `No migrations were executed` o la lista de migraciones aplicadas |
| Conexión a BD | Log: `Conexión a MySQL establecida` |
| Frontend | Abrir la URL de Vercel; recargar en `/mapa` (no debe dar 404) |
| CORS | Registrarse desde el frontend sin errores de CORS en la consola |
| Autenticación | Registro, login (Turnstile), logout |
| Funcionalidades | Mascota con foto, reporte, mapa, avistamiento desde el perfil público, QR, cartel PDF, PDF semanal (admin) |
| Correos | Confirmación del reporte y alerta por proximidad |
| Secretos | `https://<vercel>/` no expone variables de servidor; el repositorio no contiene `.env` |

## 5. Ejecutar migraciones o revertir

Desde la terminal de Railway (o con la CLI `railway run`):

```bash
npm run migrate          # aplicar pendientes
npm run migrate:undo     # revertir la última
```

Antes de revertir en producción, haz un respaldo: *Railway → MySQL → Backups*, o `mysqldump`.
