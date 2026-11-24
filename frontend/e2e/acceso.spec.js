import { test, expect } from './base';
import { datosUsuario, registrarPorApi, sinBienvenida } from './ayudas';

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

  test('registro completo entra a la app', async ({ page }) => {
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
    await expect(page).toHaveURL('http://localhost:4173/');
    await expect(page.getByRole('navigation').first()).toBeVisible();
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
