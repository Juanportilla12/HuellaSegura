const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { Usuario } = require('../models');
const { sign } = require('../config/jwt');
const { enviarCorreoResetCodigo } = require('../services/emailService');

async function verificarTurnstile(token) {
  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = await resp.json();
  return data.success === true;
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, email, password } = req.body;

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta con ese correo electrónico.',
      });
    }

    const usuario = await Usuario.create({ nombre, email, password });

    const token = sign({
      id: usuario.id,
      rol: usuario.rol,
      tokenVersion: usuario.token_version,
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      token,
      usuario: usuario.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, turnstileToken } = req.body;

    // Verificar Turnstile solo en producción
    if (process.env.NODE_ENV === 'production' && process.env.TURNSTILE_SECRET_KEY) {
      try {
        const tokenValido = turnstileToken
          ? await verificarTurnstile(turnstileToken)
          : false;
        if (!tokenValido) {
          return res.status(400).json({
            success: false,
            message: 'Verificación de seguridad fallida. Por favor intenta de nuevo.',
          });
        }
      } catch (turnstileError) {
        // Si Cloudflare no responde, permitir continuar (no bloquear el login)
        console.error('[Turnstile] Error de verificación:', turnstileError.message);
      }
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'No existe una cuenta con ese correo electrónico.',
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
      });
    }

    const passwordValida = await usuario.verificarPassword(password);
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta.',
      });
    }

    const token = sign({
      id: usuario.id,
      rol: usuario.rol,
      tokenVersion: usuario.token_version,
    });

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
      return res.status(400).json({ success: false, errors: errors.array() });
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

    await usuario.update({ reset_code: codigo, reset_code_expires: expira });

    enviarCorreoResetCodigo({ email: usuario.email, nombre: usuario.nombre, codigo }).catch(console.error);

    return res.status(200).json({
      success: true,
      message: 'Si ese correo está registrado, recibirás un código en breve.',
    });
  } catch (error) {
    next(error);
  }
}

async function verifyResetCode(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, codigo } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario || usuario.reset_code !== codigo) {
      return res.status(400).json({ success: false, message: 'Código inválido.' });
    }

    if (new Date() > new Date(usuario.reset_code_expires)) {
      return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
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
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, codigo, nuevaPassword } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario || usuario.reset_code !== codigo) {
      return res.status(400).json({ success: false, message: 'Código inválido.' });
    }

    if (new Date() > new Date(usuario.reset_code_expires)) {
      return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
    }

    // El hook beforeUpdate de Sequelize hashea la contraseña automáticamente
    await usuario.update({ password: nuevaPassword, reset_code: null, reset_code_expires: null });

    return res.status(200).json({ success: true, message: 'Contraseña restablecida exitosamente.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, logout, me, forgotPassword, verifyResetCode, resetPassword };
