import { describe, test, expect } from 'vitest';
import { urlVideoCompatible, urlPortadaVideo } from '../../src/utils/video';

const MOV = 'https://res.cloudinary.com/demo/video/upload/v17956/huella-segura/videos/mascota-44.mov';

describe('Videos de Cloudinary', () => {
  test('pide la versión MP4 (H.264 + AAC) que reproducen todos los teléfonos', () => {
    expect(urlVideoCompatible(MOV))
      .toBe('https://res.cloudinary.com/demo/video/upload/vc_h264,ac_aac,q_auto/v17956/huella-segura/videos/mascota-44.mp4');
  });

  test('usa el primer cuadro como portada', () => {
    expect(urlPortadaVideo(MOV))
      .toBe('https://res.cloudinary.com/demo/video/upload/so_0,q_auto/v17956/huella-segura/videos/mascota-44.jpg');
  });

  test('deja igual las URL que no son de Cloudinary', () => {
    expect(urlVideoCompatible('blob:http://localhost/123')).toBe('blob:http://localhost/123');
    expect(urlVideoCompatible(null)).toBe(null);
  });
});
