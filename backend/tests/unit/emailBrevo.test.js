process.env.NODE_ENV = 'test';

// En Railway (plan Hobby) el SMTP está bloqueado: con BREVO_API_KEY los correos salen
// por la API HTTPS de Brevo con el mismo contenido.
describe('Envío de correos por la API de Brevo', () => {
  const fetchOriginal = global.fetch;
  let emailService;

  beforeEach(() => {
    jest.resetModules();
    process.env.BREVO_API_KEY = 'clave-prueba';
    process.env.EMAIL_USER = 'huellasegura@gmail.com';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ messageId: 'm-1' }) });
    emailService = require('../../src/services/emailService');
  });
  afterEach(() => {
    delete process.env.BREVO_API_KEY;
    global.fetch = fetchOriginal;
  });

  test('El código de recuperación se envía a la API de Brevo con remitente, destinatario y código', async () => {
    await emailService.enviarCorreoResetCodigo({ email: 'ana@example.com', nombre: 'Ana', codigo: '482913' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(opciones.headers['api-key']).toBe('clave-prueba');
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.sender).toEqual({ name: 'HuellaSegura', email: 'huellasegura@gmail.com' });
    expect(cuerpo.to).toEqual([{ email: 'ana@example.com' }]);
    expect(cuerpo.htmlContent).toContain('482913');
  });

  test('Los adjuntos (PDF semanal) se envían en base64', async () => {
    await emailService.enviarCorreoReporteSemanal({ destinatario: 'admin@example.com', pdf: Buffer.from('PDF') });
    const cuerpo = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(cuerpo.attachment[0]).toEqual({ name: 'reporte-semanal-huellasegura.pdf', content: Buffer.from('PDF').toString('base64') });
  });

  test('Si Brevo rechaza el envío, se lanza un error con el motivo', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'Key not found' }) });
    await expect(emailService.enviarCorreoResetCodigo({ email: 'ana@example.com', nombre: 'Ana', codigo: '1' }))
      .rejects.toThrow(/Brevo respondió 401: Key not found/);
  });
});
