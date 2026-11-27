const { validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op, literal } = require('sequelize');
const { Usuario } = require('../models');
const { sign } = require('../config/jwt');
const { enviarCorreoResetCodigo, enviarCorreoVerificacion } = require('../services/emailService');

// Errores de Cloudflare que indican mala configuración del servidor (clave secreta
// ausente o que no corresponde a la clave del sitio), no un intento sospechoso.
const ERRORES_CONFIG_TURNSTILE = ['missing-input-secret', 'invalid-input-secret'];

/**
 * Verifica el token de Cloudflare Turnstile. Devuelve false solo cuando Cloudflare
 * confirma que el token es inválido. Si el widget no pudo cargar en el navegador
 * (red que bloquea Cloudflare) o las claves están mal configuradas, se deja pasar:
 * el límite de intentos fallidos (limitadorAuth) sigue protegiendo contra fuerza bruta.
 */
async function turnstileValido(token) {
  if (process.env.NODE_ENV !== 'production' || !process.env.TURNSTILE_SECRET_KEY) return true;
  if (!token) {
    console.warn('[Turnstile] Login sin token (el widget no cargó en el navegador).');
    return true;
  }
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await resp.json();
    if (data.success === true) return true;
    const codigos = data['error-codes'] || [];
    if (codigos.some((c) => ERRORES_CONFIG_TURNSTILE.includes(c))) {
      console.error(`[Turnstile] Configuración inválida (${codigos.join(', ')}). Revisa TURNSTILE_SECRET_KEY y VITE_TURNSTILE_SITE_KEY.`);
      return true;
    }
    console.warn(`[Turnstile] Token rechazado: ${codigos.join(', ')}`);
    return false;
  } catch (error) {
    // Si Cloudflare no responde, no se bloquea el login
    console.error('[Turnstile] Error de verificación:', error.message);
    return true;
  }
}

const VIGENCIA_CODIGO_MS = 15 * 60 * 1000; // 15 minutos
const ESPERA_REENVIO_MS = 60 * 1000;       // un código nuevo cada minuto como máximo
const MAX_LOGIN_FALLIDOS = 5;
const BLOQUEO_LOGIN_MS = 15 * 60 * 1000;   // 15 minutos

const VIGENCIA_ANULACION_MS = 7 * 24 * 60 * 60 * 1000; // el enlace sirve una semana

// Enlace "¿No fuiste tú?": clave aleatoria de 64 caracteres; en la base de datos solo su SHA-256
const hashAnulacion = (clave) => crypto.createHash('sha256').update(String(clave)).digest('hex');
// URL pública de este servidor (detrás del proxy de Railway, req.protocol ya es https)
const urlServidor = (req) => (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');

function nuevoEnlaceAnulacion(req) {
  const clave = crypto.randomBytes(32).toString('hex');
  return {
    enlace: `${urlServidor(req)}/api/auth/no-fui-yo?clave=${clave}`,
    campos: { anulacion_token: hashAnulacion(clave), anulacion_expira: new Date(Date.now() + VIGENCIA_ANULACION_MS) },
  };
}

const tokenDe = (usuario) => sign({ id: usuario.id, rol: usuario.rol, tokenVersion: usuario.token_version });

/**
 * Genera un código de 6 dígitos, guarda su hash (nunca el código) y lo envía al correo.
 * Sin servicio de correo (desarrollo o pruebas automáticas) el código se muestra en la
 * consola del servidor; en producción un fallo del envío se informa a quien llama.
 */
async function enviarCodigoVerificacion(usuario, req) {
  const codigo = String(crypto.randomInt(100000, 1000000));
  const anulacion = nuevoEnlaceAnulacion(req);
  await usuario.update({
    verificacion_code: await bcrypt.hash(codigo, 10),
    verificacion_expira: new Date(Date.now() + VIGENCIA_CODIGO_MS),
    verificacion_intentos: 0,
    verificacion_enviada: new Date(),
    ...anulacion.campos,
  });
  try {
    await enviarCorreoVerificacion({ email: usuario.email, nombre: usuario.nombre, codigo, enlaceAnular: anulacion.enlace });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error;
    console.warn(`[Correo] Sin servicio de correo (${error.message}). Código de verificación de ${usuario.email}: ${codigo}`);
  }
}

const reenvioReciente = (usuario) =>
  usuario.verificacion_enviada && Date.now() - new Date(usuario.verificacion_enviada) < ESPERA_REENVIO_MS;

/**
 * Registro: la cuenta queda pendiente hasta que se escribe el código enviado al correo.
 * Así nadie puede registrar un correo que no es suyo. Si el correo tiene una cuenta
 * pendiente (nunca verificada), quien se registra ahora la reemplaza: la anterior nunca
 * demostró ser dueña del correo y no debe poder "apartarlo".
 */
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { nombre, email, celular, password } = req.body;

    let usuario = await Usuario.findOne({ where: { email } });
    if (usuario?.email_verificado) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta con ese correo electrónico.',
      });
    }
    if (usuario && reenvioReciente(usuario)) {
      return res.status(429).json({
        success: false,
        message: 'Acabamos de enviar un código a ese correo. Espera un minuto antes de intentarlo de nuevo.',
      });
    }

    const nueva = !usuario;
    if (usuario) {
      usuario.set({ nombre, celular, password }); // el hook cifra la contraseña al guardar
      await usuario.save();
    } else {
      usuario = await Usuario.create({ nombre, email, celular, password, email_verificado: false });
    }

    try {
      await enviarCodigoVerificacion(usuario, req);
    } catch (errorCorreo) {
      console.error('[Correo] No se pudo enviar el código de verificación:', errorCorreo.message);
      if (nueva) await usuario.destroy();
      return res.status(503).json({
        success: false,
        message: 'No pudimos enviar el correo de verificación. Intenta de nuevo en unos minutos.',
      });
    }

    return res.status(201).json({
      success: true,
      requiereVerificacion: true,
      email: usuario.email,
      message: 'Te enviamos un código a tu correo para activar la cuenta.',
    });
  } catch (error) {
    next(error);
  }
}

// Activa la cuenta con el código enviado al correo e inicia la sesión
async function verificarCorreo(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, codigo } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    if (usuario?.email_verificado) {
      return res.status(400).json({ success: false, message: 'Esta cuenta ya está activa. Inicia sesión.' });
    }

    const resultado = await validarCodigo(usuario, codigo, 'verificacion');
    if (!resultado.ok) {
      return res.status(resultado.status).json({ success: false, message: resultado.message });
    }

    await usuario.update({
      email_verificado: true,
      verificacion_code: null,
      verificacion_expira: null,
      verificacion_intentos: 0,
      anulacion_token: null,
      anulacion_expira: null,
    });

    return res.status(200).json({
      success: true,
      message: '¡Correo verificado! Tu cuenta está activa.',
      token: tokenDe(usuario),
      usuario: usuario.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
}

// Envía un código nuevo a una cuenta pendiente (respuesta genérica: no revela cuentas)
async function reenviarVerificacion(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const usuario = await Usuario.findOne({ where: { email: req.body.email } });
    if (usuario && !usuario.email_verificado) {
      if (reenvioReciente(usuario)) {
        return res.status(429).json({ success: false, message: 'Espera un minuto antes de pedir otro código.' });
      }
      try {
        await enviarCodigoVerificacion(usuario, req);
      } catch (errorCorreo) {
        console.error('[Correo] No se pudo reenviar el código de verificación:', errorCorreo.message);
        return res.status(503).json({
          success: false,
          message: 'No pudimos enviar el correo en este momento. Intenta de nuevo en unos minutos.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Si hay una cuenta pendiente con ese correo, te enviamos un código nuevo.',
    });
  } catch (error) {
    next(error);
  }
}

// Contraseña incorrecta: tras MAX_LOGIN_FALLIDOS seguidas la cuenta se bloquea un tiempo
async function registrarLoginFallido(usuario) {
  const fallidos = (usuario.login_fallidos || 0) + 1;
  const bloquear = fallidos >= MAX_LOGIN_FALLIDOS;
  await usuario.update({
    login_fallidos: bloquear ? 0 : fallidos,
    bloqueado_hasta: bloquear ? new Date(Date.now() + BLOQUEO_LOGIN_MS) : null,
  });
  return bloquear;
}

function respuestaBloqueo(res, hasta) {
  const minutos = Math.max(1, Math.ceil((new Date(hasta) - Date.now()) / 60000));
  return res.status(423).json({
    success: false,
    codigo: 'CUENTA_BLOQUEADA',
    message: `Por seguridad bloqueamos el inicio de sesión de esta cuenta durante ${minutos} minuto(s) `
      + 'tras varios intentos fallidos. Espera o restablece tu contraseña.',
  });
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, password, turnstileToken } = req.body;

    if (!(await turnstileValido(turnstileToken))) {
      return res.status(400).json({
        success: false,
        message: 'La verificación de seguridad expiró. Intenta iniciar sesión de nuevo.',
      });
    }

    const usuario = await Usuario.findOne({ where: { email } });

    // Cuenta bloqueada temporalmente por contraseñas incorrectas seguidas
    if (usuario?.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
      return respuestaBloqueo(res, usuario.bloqueado_hasta);
    }

    // Mismo mensaje si el correo no existe o la contraseña es incorrecta (no revela cuentas)
    const passwordValida = usuario ? await usuario.verificarPassword(password) : false;
    if (!usuario || !passwordValida) {
      if (usuario && await registrarLoginFallido(usuario)) return respuestaBloqueo(res, usuario.bloqueado_hasta);
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.',
      });
    }

    if (usuario.login_fallidos || usuario.bloqueado_hasta) {
      await usuario.update({ login_fallidos: 0, bloqueado_hasta: null });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
      });
    }

    // Solo se informa después de comprobar la contraseña (no revela qué correos existen)
    if (!usuario.email_verificado) {
      if (!reenvioReciente(usuario)) {
        await enviarCodigoVerificacion(usuario, req).catch((e) => console.error('[Correo] Verificación al iniciar sesión:', e.message));
      }
      return res.status(403).json({
        success: false,
        codigo: 'CORREO_NO_VERIFICADO',
        email: usuario.email,
        message: 'Tu correo aún no está verificado. Te enviamos un código para activar la cuenta.',
      });
    }

    const token = tokenDe(usuario);

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      usuario: usuario.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    // Incrementar tokenVersion invalida todos los tokens anteriores del usuario
    await req.usuario.increment('token_version');

    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente.',
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  return res.status(200).json({
    success: true,
    usuario: req.usuario.toPublicJSON(),
  });
}

async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });

    // Respuesta genérica para no revelar si el correo existe
    if (!usuario) {
      return res.status(200).json({
        success: true,
        message: 'Si ese correo está registrado, recibirás un código en breve.',
      });
    }

    const codigo = String(crypto.randomInt(100000, 999999));
    const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    const codigoHash = await bcrypt.hash(codigo, 10);
    const anulacion = nuevoEnlaceAnulacion(req);
    await usuario.update({ reset_code: codigoHash, reset_code_expires: expira, reset_intentos: 0, ...anulacion.campos });

    // Se espera el envío: si el correo no sale, el usuario debe saberlo en vez de
    // quedarse esperando un código que nunca llegará
    try {
      await enviarCorreoResetCodigo({ email: usuario.email, nombre: usuario.nombre, codigo, enlaceAnular: anulacion.enlace });
    } catch (errorCorreo) {
      console.error('[Correo] No se pudo enviar el código de recuperación:', errorCorreo.message);
      await usuario.update({ reset_code: null, reset_code_expires: null });
      return res.status(503).json({
        success: false,
        message: 'No pudimos enviar el correo en este momento. Intenta de nuevo en unos minutos.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Si ese correo está registrado, recibirás un código en breve.',
    });
  } catch (error) {
    next(error);
  }
}

const MAX_INTENTOS_CODIGO = 5;

const CAMPOS_CODIGO = {
  recuperacion: { codigo: 'reset_code', expira: 'reset_code_expires', intentos: 'reset_intentos' },
  verificacion: { codigo: 'verificacion_code', expira: 'verificacion_expira', intentos: 'verificacion_intentos' },
};

/**
 * Valida un código enviado al correo (recuperación de contraseña o verificación de la
 * cuenta): existe, no expiró, no superó 5 intentos y coincide con el hash guardado.
 * Cada intento fallido se cuenta; al llegar al máximo el código se invalida y hay que
 * solicitar uno nuevo.
 */
async function validarCodigo(usuario, codigo, tipo) {
  const c = CAMPOS_CODIGO[tipo];
  const invalido = { ok: false, status: 400, message: 'Código inválido o expirado. Solicita uno nuevo.' };
  const agotado = { ok: false, status: 429, message: 'Demasiados intentos. Solicita un código nuevo.' };
  // Al invalidar se conserva el contador: solo un código nuevo lo reinicia
  const invalidar = () => usuario.update({ [c.codigo]: null, [c.expira]: null });

  if (!usuario || !usuario[c.codigo] || !usuario[c.expira]) return invalido;
  if (new Date() > new Date(usuario[c.expira])) return invalido;

  const previos = usuario[c.intentos] || 0;
  if (previos >= MAX_INTENTOS_CODIGO) {
    await invalidar();
    return agotado;
  }

  // El intento se reserva en la base de datos ANTES de comparar: con peticiones
  // simultáneas, la condición del UPDATE impide evaluar más de 5 códigos.
  const [reservado] = await Usuario.update(
    { [c.intentos]: literal(`${c.intentos} + 1`) },
    { where: { id: usuario.id, [c.codigo]: { [Op.ne]: null }, [c.intentos]: { [Op.lt]: MAX_INTENTOS_CODIGO } } }
  );
  if (reservado === 0) {
    await invalidar();
    return agotado;
  }

  const coincide = await bcrypt.compare(String(codigo), usuario[c.codigo]);
  if (!coincide) {
    const intentos = previos + 1;
    if (intentos >= MAX_INTENTOS_CODIGO) {
      await invalidar();
      return agotado;
    }
    return {
      ok: false,
      status: 400,
      message: `Código incorrecto. Te quedan ${MAX_INTENTOS_CODIGO - intentos} intento(s).`,
    };
  }

  return { ok: true };
}

const validarCodigoRecuperacion = (usuario, codigo) => validarCodigo(usuario, codigo, 'recuperacion');

async function verifyResetCode(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, codigo } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    const resultado = await validarCodigoRecuperacion(usuario, codigo);
    if (!resultado.ok) {
      return res.status(resultado.status).json({ success: false, message: resultado.message });
    }

    return res.status(200).json({ success: true, message: 'Código verificado correctamente.' });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, codigo, nuevaPassword } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    const resultado = await validarCodigoRecuperacion(usuario, codigo);
    if (!resultado.ok) {
      return res.status(resultado.status).json({ success: false, message: resultado.message });
    }

    // El hook beforeUpdate hashea la contraseña. Se incrementa token_version
    // para cerrar las sesiones abiertas con la contraseña anterior.
    await usuario.update({
      password: nuevaPassword,
      reset_code: null,
      reset_code_expires: null,
      reset_intentos: 0,
      token_version: (usuario.token_version || 0) + 1,
      anulacion_token: null,
      anulacion_expira: null,
      // El código llegó a su correo: queda verificado y sin bloqueo por intentos fallidos
      email_verificado: true,
      login_fallidos: 0,
      bloqueado_hasta: null,
    });

    return res.status(200).json({ success: true, message: 'Contraseña restablecida exitosamente.' });
  } catch (error) {
    next(error);
  }
}

/**
 * "¿No fuiste tú?" desde el correo: anula el código. Si la cuenta nunca se verificó, alguien
 * intentó registrar este correo sin ser su dueño: se cancela ese registro y el correo queda
 * libre. Si la cuenta ya estaba verificada, se anula el código para cambiar la contraseña.
 */
const ROJO = '#DC2626';

// Página mínima con los colores de la marca, servida por el propio backend
function paginaSimple({ titulo, cuerpo }) {
  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${titulo} — HuellaSegura</title>
<style>
  body{margin:0;background:#FFF8F5;font-family:Arial,Helvetica,sans-serif;color:#1A1A2E}
  .tarjeta{max-width:440px;margin:32px auto;background:#fff;border:1px solid #EDE5E1;border-radius:20px;overflow:hidden}
  .marca{background:#E8732F;color:#fff;font-weight:bold;font-size:20px;padding:18px 24px}
  .contenido{padding:24px;line-height:1.55}
  h1{font-size:22px;margin:0 0 10px} p{margin:0 0 16px;color:#4B5563}
  button{width:100%;padding:15px;border:0;border-radius:14px;background:${ROJO};color:#fff;font-size:16px;font-weight:bold;cursor:pointer}
  .secundario{display:block;text-align:center;margin-top:14px;color:#6B7280;font-size:14px}
</style></head>
<body><div class="tarjeta"><div class="marca">HuellaSegura</div><div class="contenido">${cuerpo}</div></div></body></html>`;
}

const claveValida = (clave) => /^[a-f0-9]{64}$/.test(String(clave || ''));

/**
 * GET del enlace "No fui yo" del correo: solo muestra la confirmación. No anula nada al
 * abrirse, porque algunos programas de correo abren los enlaces para revisarlos.
 */
function paginaNoFuiYo(req, res) {
  const { clave } = req.query;
  res.set('Content-Type', 'text/html; charset=utf-8');
  // Con la política general "no-referrer" el navegador envía el formulario con origen "null"
  // y CORS lo rechazaría; "same-origin" sigue sin compartir nada con otros sitios
  res.set('Referrer-Policy', 'same-origin');
  if (!claveValida(clave)) {
    return res.status(400).send(paginaSimple({ titulo: 'Enlace no válido', cuerpo: '<h1>Enlace no válido</h1><p>Revisa que hayas abierto el enlace completo del correo.</p>' }));
  }
  return res.send(paginaSimple({
    titulo: '¿No fuiste tú?',
    cuerpo: `<h1>¿No fuiste tú?</h1>
      <p>Si no pediste el código que te llegó al correo, anúlalo y nadie podrá usarlo.
      Si alguien intentó crear una cuenta con tu correo, ese registro se cancela.</p>
      <form method="post" action="${urlServidor(req)}/api/auth/no-fui-yo">
        <input type="hidden" name="clave" value="${clave}">
        <button type="submit">No fui yo: anular el código</button>
      </form>
      <span class="secundario">Si sí fuiste tú, puedes cerrar esta página.</span>`,
  }));
}

/**
 * "¿No fuiste tú?" desde el correo: anula el código. Si la cuenta nunca se verificó, alguien
 * intentó registrar este correo sin ser su dueño: se cancela ese registro y el correo queda
 * libre. Si la cuenta ya estaba verificada, se anula el código para cambiar la contraseña.
 * Responde JSON a la app y una página HTML al formulario de la página del servidor.
 */
async function anularCodigo(req, res, next) {
  const desdeFormulario = req.is('application/x-www-form-urlencoded');
  const responder = (status, datos, titulo) => {
    if (!desdeFormulario) return res.status(status).json(datos);
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.status(status).send(paginaSimple({ titulo, cuerpo: `<h1>${titulo}</h1><p>${datos.message}</p>` }));
  };
  try {
    if (!claveValida(req.body.clave)) {
      return responder(400, { success: false, message: 'Este enlace no es válido.' }, 'Enlace no válido');
    }

    const usuario = await Usuario.findOne({
      where: { anulacion_token: hashAnulacion(req.body.clave), anulacion_expira: { [Op.gt]: new Date() } },
    });
    if (!usuario) {
      return responder(400, { success: false, message: 'Este enlace ya no es válido: se usó antes o venció.' }, 'Enlace no válido');
    }

    if (!usuario.email_verificado) {
      await usuario.destroy();
      return responder(200, {
        success: true,
        resultado: 'registro_cancelado',
        message: 'Listo: cancelamos ese registro y el código quedó anulado. Nadie podrá usar tu correo sin tu permiso.',
      }, 'Código anulado');
    }

    await usuario.update({
      reset_code: null, reset_code_expires: null, reset_intentos: 0, anulacion_token: null, anulacion_expira: null,
    });
    return responder(200, {
      success: true,
      resultado: 'codigo_anulado',
      message: 'Listo: anulamos el código para cambiar la contraseña. Tu contraseña sigue igual.',
    }, 'Código anulado');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  anularCodigo, paginaNoFuiYo,
  register, verificarCorreo, reenviarVerificacion, login, logout, me, forgotPassword, verifyResetCode, resetPassword,
};
