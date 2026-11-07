import { describe, expect, it } from 'vitest';
import { contarFiltrosPanel, escribirFiltros, FILTROS_INICIALES, leerFiltros } from '../filtrosCatalogo';

describe('filtros del catálogo', () => {
  it('lee y escribe la misma consulta', () => {
    const consulta = 'q=suero&categoria=piel&tipo=med&descuento=1&orden=nombre&pagina=2';
    expect(escribirFiltros(leerFiltros(`?${consulta}`))).toBe(consulta);
  });

  it('ignora los valores que no existen', () => {
    expect(leerFiltros('?categoria=nada&tipo=x&orden=y&pagina=-3')).toEqual({ ...FILTROS_INICIALES, pagina: 1 });
  });

  it('los filtros iniciales no ensucian la URL', () => {
    expect(escribirFiltros(FILTROS_INICIALES)).toBe('');
  });

  it('cuenta solo los filtros del botón', () => {
    expect(contarFiltrosPanel({ ...FILTROS_INICIALES, categoria: 'piel', q: 'x' })).toBe(0);
    expect(contarFiltrosPanel({ ...FILTROS_INICIALES, tipo: 'med', descuento: true, orden: 'nombre' })).toBe(3);
  });
});
