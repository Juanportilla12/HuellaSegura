import { describe, test, expect } from 'vitest';
import { agruparReportes } from '../../src/components/mapa/agruparReportes';

const r = (id, latitud, longitud) => ({ id, latitud, longitud, mascota: { nombre: `M${id}` } });

describe('Agrupar reportes del mapa', () => {
  test('dos mascotas en el mismo punto forman un solo grupo con las dos', () => {
    const grupos = agruparReportes([r(1, 1.2136, -77.2811), r(2, 1.2136, -77.2811)]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].reportes.map((x) => x.id)).toEqual([1, 2]);
    expect(grupos[0].clave).toBe('1-2');
  });

  test('a menos de 30 m se consideran el mismo lugar', () => {
    // 0.0002° de latitud ≈ 22 m
    expect(agruparReportes([r(1, 1.2136, -77.2811), r(2, 1.2138, -77.2811)])).toHaveLength(1);
  });

  test('lugares separados quedan como pines distintos', () => {
    // 0.001° ≈ 111 m
    expect(agruparReportes([r(1, 1.2136, -77.2811), r(2, 1.2146, -77.2811)])).toHaveLength(2);
  });

  test('acepta coordenadas como texto e ignora las inválidas', () => {
    expect(agruparReportes([r(1, '1.2136', '-77.2811'), r(2, null, null)])).toHaveLength(1);
  });
});
