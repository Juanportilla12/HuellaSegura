import { test, expect } from './base';
import {
  API, datosUsuario, registrarPorApi, sinBienvenida, fijarCodigoVerificacion, CODIGO_PRUEBA, consultarBD,
} from './ayudas';

test.beforeEach(async ({ page }) => { await sinBienvenida(page); });

test.describe('Registro', () => {
  test('no deja continuar con los datos vacíos', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /continuar/i }).click();
    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();
    await expect(page.getByText('El correo es obligatorio.')).toBeVisible();
    await expect(page.getByText('El celular es obligatorio.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible(); // sigue en el paso 1
  });

  test('no acepta espacios en blanco, correo ni celular inválidos', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/nombre completo/i).fill('   ');
    await page.getByLabel(/correo electrónico/i).fill('correo-sin-arroba');
    await page.getByLabel(/^celular/i).fill('12-34');
    await page.getByRole('button', { name: /continuar/i }).click();
    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();
    await expect(page.getByText(/ingresa un correo válido/i)).toBeVisible();
    await expect(page.getByText(/ingresa un celular válido/i)).toBeVisible();
  });

  test('el paso 2 exige contraseña, confirmación y autorización de datos', async ({ page }) => {
    const u = datosUsuario('registro');
    await page.goto('/register');
    await page.getByLabel(/nombre completo/i).fill(u.nombre);
    await page.getByLabel(/correo electrónico/i).fill(u.email);
    await page.getByLabel(/^celular/i).fill(u.celular);
    await page.getByRole('button', { name: /continuar/i }).click();

    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.getByText('La contraseña es obligatoria.')).toBeVisible();
    await expect(page.getByText('Confirma tu contraseña.')).toBeVisible();
    await expect(page.getByText(/debes autorizar/i)).toBeVisible();

    await page.getByLabel(/^contraseña/i).fill('corta');
    await page.getByLabel(/confirmar contraseña/i).fill('distinta');
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.getByText(/al menos 8 caracteres/i)).toBeVisible();
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('registro completo: pide el código enviado al correo y con él activa la cuenta', async ({ page }) => {
    const u = datosUsuario('registro');
    await page.goto('/register');
    await page.getByLabel(/nombre completo/i).fill(u.nombre);
    await page.getByLabel(/correo electrónico/i).fill(u.email);
    await page.getByLabel(/^celular/i).fill(u.celular);
    await page.getByRole('button', { name: /continuar/i }).click();
    await page.getByLabel(/^contraseña/i).fill(u.password);
    await page.getByLabel(/confirmar contraseña/i).fill(u.password);
    await page.getByTestId('check-datos').check();
    await page.getByRole('button', { name: /crear cuenta/i }).click();

    // La cuenta queda pendiente: se pide el código enviado al correo
    await expect(page).toHaveURL(/\/verificar-correo$/);
    await expect(page.getByTestId('correo-a-verificar')).toHaveText(u.email);

    // Un código equivocado no activa la cuenta
    await fijarCodigoVerificacion(u.email);
    await page.getByLabel('Dígito 1').fill('9');
    for (const [i, d] of [...'99999'].entries()) await page.getByLabel(`Dígito ${i + 2}`).fill(d);
    await page.getByRole('button', { name: /activar mi cuenta/i }).click();
    await expect(page.getByText(/código incorrecto/i)).toBeVisible();

    // Con el código correcto entra a la app
    for (const [i, d] of [...CODIGO_PRUEBA].entries()) await page.getByLabel(`Dígito ${i + 1}`).fill(d);
    await page.getByRole('button', { name: /activar mi cuenta/i }).click();
    await expect(page).toHaveURL('http://localhost:4173/');
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test('con la contraseña correcta pero el correo sin verificar, el login lleva a escribir el código', async ({ page, request }) => {
    const u = datosUsuario('sin-verificar');
    expect((await request.post(`${API}/auth/register`, { data: u })).status()).toBe(201);
    await page.goto('/login');
    await page.getByLabel(/correo electrónico/i).fill(u.email);
    await page.getByLabel(/^contraseña/i).fill(u.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/verificar-correo$/);
    await expect(page.getByTestId('correo-a-verificar')).toHaveText(u.email);
  });

  test('5 contraseñas incorrectas bloquean la cuenta y se informa', async ({ page, request }) => {
    const u = await registrarPorApi(request, datosUsuario('bloqueo'));
    await page.goto('/login');
    await page.getByLabel(/correo electrónico/i).fill(u.email);
    for (let i = 0; i < 5; i += 1) {
      await page.getByLabel(/^contraseña/i).fill(`adivinando${i}`);
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      await page.waitForTimeout(400);
    }
    await expect(page.getByText(/bloqueamos el inicio de sesión de esta cuenta/i)).toBeVisible();
  });

  test('correo ya registrado vuelve al paso 1 con el mensaje', async ({ page, request }) => {
    const existente = await registrarPorApi(request, datosUsuario('duplicado'));
    await page.goto('/register');
    await page.getByLabel(/nombre completo/i).fill('Otra Persona');
    await page.getByLabel(/correo electrónico/i).fill(existente.email);
    await page.getByLabel(/^celular/i).fill('301 555 1234');
    await page.getByRole('button', { name: /continuar/i }).click();
    await page.getByLabel(/^contraseña/i).fill('Clave-segura-123');
    await page.getByLabel(/confirmar contraseña/i).fill('Clave-segura-123');
    await page.getByTestId('check-datos').check();
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.getByText(/ya existe una cuenta con ese correo/i)).toBeVisible();
  });
});

test.describe('Inicio de sesión', () => {
  test('formulario vacío y correo inválido muestran errores', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.getByText('El correo es obligatorio.')).toBeVisible();
    await expect(page.getByText('La contraseña es obligatoria.')).toBeVisible();

    await page.getByLabel(/correo electrónico/i).fill('nocorreo');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.getByText(/ingresa un correo válido/i)).toBeVisible();
  });

  test('contraseña incorrecta muestra el error y no recarga la página', async ({ page, request }) => {
    const u = await registrarPorApi(request, datosUsuario('login'));
    await page.goto('/login');
    await page.getByLabel(/correo electrónico/i).fill(u.email);
    await page.getByLabel(/^contraseña/i).fill('otra-clave-123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.getByText(/correo o contraseña incorrectos/i)).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toHaveValue(u.email); // no se recargó
  });

  test('credenciales correctas entran y se puede cerrar sesión', async ({ page, request }) => {
    const u = await registrarPorApi(request, datosUsuario('login'));
    await page.goto('/login');
    await page.getByLabel(/correo electrónico/i).fill(`  ${u.email}  `); // espacios accidentales
    await page.getByLabel(/^contraseña/i).fill(u.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('http://localhost:4173/');

    await page.goto('/perfil');
    await page.getByRole('button', { name: /cerrar sesión/i }).first().click();
    await page.getByRole('alertdialog').getByRole('button', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('recuperar contraseña valida el correo', async ({ page }) => {
    await page.goto('/olvide-contrasena');
    await page.getByRole('button', { name: /enviar|código/i }).first().click();
    await expect(page.getByText(/ingresa tu correo/i)).toBeVisible();
    await page.getByLabel(/correo electrónico/i).fill('malo@');
    await page.getByRole('button', { name: /enviar|código/i }).first().click();
    await expect(page.getByText(/ingresa un correo válido/i)).toBeVisible();
  });
});

test.describe('"¿No fuiste tú?" desde el correo', () => {
  test('anula el registro hecho con tu correo, el enlace no se puede reusar y tu correo queda libre', async ({ page, request }) => {
    await sinBienvenida(page);
    const crypto = await import('node:crypto');
    const u = datosUsuario('suplantado');
    // Alguien registra tu correo (queda pendiente: nunca recibió el código)
    expect((await request.post(`${API}/auth/register`, { data: { ...u, nombre: 'Suplantador' } })).status()).toBe(201);

    // El enlace real llega en el correo; aquí se fija una clave conocida en la base de datos de prueba
    const clave = crypto.randomBytes(32).toString('hex');
    await consultarBD('UPDATE usuarios SET anulacion_token = ?, anulacion_expira = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE email = ?',
      [crypto.createHash('sha256').update(clave).digest('hex'), u.email]);

    await page.goto(`/no-fui-yo?clave=${clave}`);
    await expect(page.getByRole('heading', { name: '¿No fuiste tú?' })).toBeVisible();
    await page.getByTestId('btn-anular').click();
    await expect(page.getByTestId('mensaje-anulado')).toContainText(/cancelamos ese registro/i);
    expect(await consultarBD('SELECT id FROM usuarios WHERE email = ?', [u.email])).toHaveLength(0);

    // El mismo enlace ya no sirve
    await page.goto(`/no-fui-yo?clave=${clave}`);
    await page.getByTestId('btn-anular').click();
    await expect(page.getByText(/ya no es válido/i)).toBeVisible();

    // Tu correo quedó libre: te registras tú
    expect((await request.post(`${API}/auth/register`, { data: u })).status()).toBe(201);
  });
});
