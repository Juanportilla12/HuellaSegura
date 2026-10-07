process.env.NODE_ENV = 'test';

jest.mock('../../src/models', () => ({
  Mascota: { findAll: jest.fn() },
  Avistamiento: { findAll: jest.fn() },
}));
jest.mock('../../src/config/connection', () => ({ authenticate: jest.fn(), define: jest.fn() }));

const { cloudinary } = require('../../src/config/cloudinary');
const { datosDesdeUrl, eliminarArchivos, archivosDeUsuario } = require('../../src/services/archivosService');
const { Mascota, Avistamiento } = require('../../src/models');

const FOTO = 'https://res.cloudinary.com/demo/image/upload/v1712345/huella-segura/mascotas/mascota-5-1.jpg';
const VIDEO = 'https://res.cloudinary.com/demo/video/upload/v99/huella-segura/videos/mascota-5.mp4';

beforeEach(() => jest.clearAllMocks());

describe('Borrado de archivos en Cloudinary (Ley 1581)', () => {
  test('Obtiene el tipo y el public_id desde la URL', () => {
    expect(datosDesdeUrl(FOTO)).toEqual({ tipo: 'image', publicId: 'huella-segura/mascotas/mascota-5-1' });
    expect(datosDesdeUrl(VIDEO)).toEqual({ tipo: 'video', publicId: 'huella-segura/videos/mascota-5' });
    expect(datosDesdeUrl('https://otro-sitio.com/x.jpg')).toBeNull();
  });

  test('Borra cada archivo con su tipo, sin duplicados y sin fallar si uno falla', async () => {
    const destroy = jest.spyOn(cloudinary.uploader, 'destroy')
      .mockResolvedValueOnce({ result: 'ok' })
      .mockRejectedValueOnce(new Error('no existe'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const borrados = await eliminarArchivos([FOTO, FOTO, VIDEO, null]);
    expect(destroy).toHaveBeenCalledTimes(2);
    expect(destroy).toHaveBeenCalledWith('huella-segura/mascotas/mascota-5-1', { resource_type: 'image' });
    expect(destroy).toHaveBeenCalledWith('huella-segura/videos/mascota-5', { resource_type: 'video' });
    expect(borrados).toBe(1);
  });

  test('Reúne foto de perfil, fotos, video y fotos de avistamientos del usuario', async () => {
    Mascota.findAll.mockResolvedValue([{ id: 5, foto_urls: [FOTO], video_url: VIDEO }]);
    Avistamiento.findAll.mockResolvedValue([{ foto_url: 'https://res.cloudinary.com/demo/image/upload/v1/huella-segura/avistamientos/a.jpg' }]);
    const urls = await archivosDeUsuario({ id: 1, foto_url: 'https://res.cloudinary.com/demo/image/upload/v1/huella-segura/perfiles/perfil_1.jpg' });
    expect(urls).toHaveLength(4);
  });
});
