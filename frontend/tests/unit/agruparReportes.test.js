import { describe, test, expect } from 'vitest';
import { agruparReportes, distanciaDeAgrupacion } from '../../src/components/mapa/agruparReportes';

const r = (id, latitud, longitud) => ({ id, latitud, longitud, mascota: { nombre: `M${id}` } });

describe('Agrupar reportes del mapa', () => {
  test('dos mascotas en el mismo punto forman un solo grupo, con cualquier zoom', () => {
    for (const zoom of [12, 16, 19]) {
      const grupos = agruparReportes([r(1, 1.2136, -77.2811), r(2, 1.2136, -77.2811)], { zoom });
      expect(grupos).toHaveLength(1);
      expect(grupos[0].reportes.map((x) => x.id)).toEqual([1, 2]);
      expect(grupos[0].mismoPunto).toBe(true);
    }
  });

  test('con el mapa alejado, pines a ~300 m (que se tapan en pantalla) se agrupan como zona', () => {
    const grupos = agruparReportes([r(1, 1.2136, -77.2811), r(2, 1.2163, -77.2811)], { zoom: 14 });
    expect(grupos).toHaveLength(1);
    expect(grupos[0].mismoPunto).toBe(false);
  });

  test('al acercar el mapa, esos mismos pines se separan', () => {
    expect(agruparReportes([r(1, 1.2136, -77.2811), r(2, 1.2163, -77.2811)], { zoom: 18 })).toHaveLength(2);
  });

  test('la distancia de agrupación nunca baja de 30 m y crece al alejar el mapa', () => {
    expect(distanciaDeAgrupacion(19, 1.2)).toBe(30);
    expect(distanciaDeAgrupacion(14, 1.2)).toBeGreaterThan(distanciaDeAgrupacion(16, 1.2));
  });

  test('acepta coordenadas como texto e ignora las inválidas', () => {
    expect(agruparReportes([r(1, '1.2136', '-77.2811'), r(2, null, null)], { zoom: 16 })).toHaveLength(1);
  });
});
