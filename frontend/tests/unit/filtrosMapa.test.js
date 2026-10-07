import { describe, test, expect } from 'vitest';
import { filtrarReportes, tiempoTranscurrido } from '../../src/components/mapa/filtrosMapa';
import { distanciaKm } from '../../src/utils/distancia';

const hace = (minutos) => new Date(Date.now() - minutos * 60000).toISOString();

const REPORTES = [
  { id: 1, created_at: hace(30),    mascota: { nombre: 'Luna',  especie: 'perro', raza: 'Labrador' } },
  { id: 2, created_at: hace(600),   mascota: { nombre: 'Michi', especie: 'gato',  raza: 'Siamés' } },
  { id: 3, created_at: hace(20000), mascota: { nombre: 'Rocky', especie: 'perro', raza: 'Criollo' } },
];

const ids = (lista) => lista.map((r) => r.id);

describe('R10 / HU-14 — filtros del mapa', () => {
  test('Sin filtros devuelve todos', () => {
    expect(ids(filtrarReportes(REPORTES, { especie: 'todos', tiempo: 'todos', texto: '' }))).toEqual([1, 2, 3]);
  });

  test('Filtra por especie', () => {
    expect(ids(filtrarReportes(REPORTES, { especie: 'perro', tiempo: 'todos', texto: '' }))).toEqual([1, 3]);
  });

  test('Filtra por antigüedad', () => {
    expect(ids(filtrarReportes(REPORTES, { especie: 'todos', tiempo: '1h', texto: '' }))).toEqual([1]);
    expect(ids(filtrarReportes(REPORTES, { especie: 'todos', tiempo: '24h', texto: '' }))).toEqual([1, 2]);
  });

  test('Busca por nombre o raza sin distinguir mayúsculas', () => {
    expect(ids(filtrarReportes(REPORTES, { especie: 'todos', tiempo: 'todos', texto: 'siam' }))).toEqual([2]);
    expect(ids(filtrarReportes(REPORTES, { especie: 'todos', tiempo: 'todos', texto: 'ROCKY' }))).toEqual([3]);
  });

  test('Combina filtros', () => {
    expect(ids(filtrarReportes(REPORTES, { especie: 'perro', tiempo: '24h', texto: '' }))).toEqual([1]);
  });

  test('Tiempo transcurrido legible', () => {
    expect(tiempoTranscurrido(hace(5))).toBe('5m');
    expect(tiempoTranscurrido(hace(180))).toBe('3h');
    expect(tiempoTranscurrido(hace(3000))).toBe('2d');
  });
});

describe('Distancia (Haversine)', () => {
  test('Mismo punto → 0 km', () => {
    expect(distanciaKm(1.2136, -77.2811, 1.2136, -77.2811)).toBe(0);
  });

  test('~0.01° de latitud en Pasto ≈ 1.1 km', () => {
    expect(distanciaKm(1.2136, -77.2811, 1.2236, -77.2811)).toBeCloseTo(1.11, 1);
  });
});
