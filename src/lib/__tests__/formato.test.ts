import { describe, expect, it } from 'vitest';
import { aSlug, esMarcador, formatearPrecio, normalizarTexto } from '../formato';

describe('formato', () => {
  it('formatea pesos colombianos sin decimales ni espacio', () => {
    expect(formatearPrecio(7000)).toBe('$7.000');
    expect(formatearPrecio(13200)).toBe('$13.200');
    expect(formatearPrecio(350)).toBe('$350');
    expect(formatearPrecio(1234567)).toBe('$1.234.567');
  });

  it('normaliza tildes y mayúsculas', () => {
    expect(normalizarTexto('Acetaminofén ÑANDÚ')).toBe('acetaminofen nandu');
  });

  it('genera slugs legibles', () => {
    expect(aSlug('Diclofenaco gel 1 %')).toBe('diclofenaco-gel-1');
    expect(aSlug('Hidróxido de aluminio y magnesio')).toBe('hidroxido-de-aluminio-y-magnesio');
    expect(aSlug('Protector solar FPS 50')).toBe('protector-solar-fps-50');
  });

  it('reconoce los textos por llenar de la plantilla', () => {
    expect(esMarcador('[Laboratorio]')).toBe(true);
    expect(esMarcador('INVIMA [número]')).toBe(false);
    expect(esMarcador('')).toBe(false);
  });
});
