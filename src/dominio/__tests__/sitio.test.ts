import { describe, expect, it } from 'vitest';
import { profesionConArticulo } from '../sitio';

describe('profesionConArticulo', () => {
  it('ajusta el artículo al género de la profesión', () => {
    expect(profesionConArticulo('Química farmacéutica')).toBe('una química farmacéutica');
    expect(profesionConArticulo('Químico farmacéutico')).toBe('un químico farmacéutico');
  });

  it('usa la profesión por defecto si falta o es un marcador', () => {
    expect(profesionConArticulo('')).toBe('un químico farmacéutico');
    expect(profesionConArticulo('[Profesión]')).toBe('un químico farmacéutico');
  });
});
