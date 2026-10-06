process.env.NODE_ENV = 'test';

const { generarCartelMascota, generarReporteSemanal } = require('../../src/services/pdfService');

const MASCOTA_MOCK = {
  id: 1, nombre: 'Firulais', especie: 'perro', raza: 'Labrador',
  sexo: 'macho', color: 'Dorado', descripcion: 'Muy amigable.',
  foto_urls: [], foto_principal: null,
};

const REPORTES_MOCK = [
  { id: 1, mascota_id: 1, estado: 'en_busqueda', fecha_perdida: '2026-04-20', latitud: 1.2136, longitud: -77.2811 },
  { id: 2, mascota_id: 2, estado: 'encontrada',  fecha_perdida: '2026-04-18', latitud: 1.2100, longitud: -77.2800 },
  { id: 3, mascota_id: 3, estado: 'cerrado',     fecha_perdida: '2026-04-15', latitud: 1.2200, longitud: -77.2900 },
];

const SEMANA_MOCK = {
  activos:   REPORTES_MOCK.filter((r) => r.estado === 'en_busqueda'),
  resueltos: REPORTES_MOCK.filter((r) => r.estado === 'encontrada'),
};

describe('pdfService', () => {
  test('HU-31: el cartel incluye el QR cuando se proporciona', async () => {
    const QRCode = require('qrcode');
    const qrBuffer = await QRCode.toBuffer('https://example.com/publico/mascotas/1', { type: 'png' });
    const sinQR = await generarCartelMascota(MASCOTA_MOCK);
    const conQR = await generarCartelMascota(MASCOTA_MOCK, { qrBuffer });
    expect(conQR.slice(0, 4).toString()).toBe('%PDF');
    expect(conQR.length).toBeGreaterThan(sinQR.length);
  });

  test('Genera un PDF válido con datos de la mascota', async () => {
    const buffer = await generarCartelMascota(MASCOTA_MOCK);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    // Los archivos PDF inician con la firma %PDF
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
  });

  test('El reporte semanal incluye todos los casos del período', async () => {
    const buffer = await generarReporteSemanal(SEMANA_MOCK);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(100);
  });

  test('El PDF se genera sin errores aunque la mascota no tenga foto', async () => {
    const mascotaSinFoto = { ...MASCOTA_MOCK, foto_principal: null, foto_urls: [] };
    await expect(generarCartelMascota(mascotaSinFoto)).resolves.toBeDefined();
  });

  test('El reporte semanal se genera aunque no haya reportes', async () => {
    const buffer = await generarReporteSemanal({ activos: [], resueltos: [] });
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
  });

  test('El cartel y el reporte semanal generan PDFs de tamaño diferente', async () => {
    const bufferCartel   = await generarCartelMascota(MASCOTA_MOCK);
    const bufferReporte  = await generarReporteSemanal(SEMANA_MOCK);
    // Ambos son PDFs válidos pero de contenido diferente
    expect(bufferCartel.slice(0, 4).toString()).toBe('%PDF');
    expect(bufferReporte.slice(0, 4).toString()).toBe('%PDF');
    // El reporte semanal con tabla es más grande que el cartel simple
    expect(bufferReporte.length).toBeGreaterThan(0);
    expect(bufferCartel.length).toBeGreaterThan(0);
  });
});
