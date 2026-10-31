import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { csvAObjetos } from '../csv';
import { validarProductos } from '../datos';
import { buscar, contarPorCategoria, filtrar, paginar, resumir, sePuedeAgregar } from '../catalogo';

const productos = validarProductos(csvAObjetos(readFileSync('datos/productos.csv', 'utf8'))).datos.map(resumir);
const ids = (lista: { id: string }[]) => lista.map((p) => p.id);

describe('buscar', () => {
  it('encuentra sin tildes y por síntoma de la categoría', () => {
    expect(ids(buscar(productos, 'ACETAMINOFEN'))).toEqual(['a1']);
    expect(ids(buscar(productos, 'dolor de cabeza'))).toEqual(['a1', 'a4', 'a2', 'a3']);
    expect(ids(buscar(productos, 'diarrea'))).toContain('c2');
  });

  it('sin términos útiles no devuelve nada', () => {
    expect(buscar(productos, '  de la ')).toEqual([]);
  });
});

describe('filtrar', () => {
  it('por categoría, tipo y descuento', () => {
    expect(ids(filtrar(productos, { categoria: 'piel' }))).toEqual(['d2', 'd1']);
    expect(filtrar(productos, { tipo: 'dis' }).every((p) => p.tipo === 'dis')).toBe(true);
    expect(ids(filtrar(productos, { soloDescuento: true })).sort()).toEqual(['d1', 'd2', 'e1']);
  });

  it('«Destacados» pone primero los descuentos y al final los agotados', () => {
    const lista = filtrar(productos, {});
    expect(ids(lista.slice(0, 3)).sort()).toEqual(['d1', 'd2', 'e1']);
    expect(lista.at(-1)?.id).toBe('e2');
  });

  it('ordena por precio y deja los de fórmula (sin precio) al final al ordenar de menor a mayor', () => {
    const lista = filtrar(productos, { orden: 'precio-asc' });
    expect(lista[0].id).toBe('a1');
    expect(lista.slice(-3).every((p) => p.condicionVenta === 'formula')).toBe(true);
    expect(filtrar(productos, { orden: 'precio-desc' })[0].id).toBe('d1');
  });

  it('cuenta por categoría con los demás filtros', () => {
    expect(contarPorCategoria(productos, {})).toMatchObject({ dolor: 4, piel: 2, formula: 3 });
    expect(contarPorCategoria(productos, { soloDescuento: true })).toMatchObject({ dolor: 0, piel: 2, bebes: 1 });
  });
});

describe('paginar y reglas de venta', () => {
  it('pagina y ajusta páginas fuera de rango', () => {
    expect(paginar(productos, 2, 20)).toMatchObject({ pagina: 2, paginas: 2 });
    expect(paginar(productos, 2, 20).items).toHaveLength(4);
    expect(paginar(productos, 9, 20).pagina).toBe(2);
    expect(paginar([], 1, 20)).toEqual({ items: [], pagina: 1, paginas: 1 });
  });

  it('solo se agregan productos de venta libre con existencias', () => {
    const porId = (id: string) => productos.find((p) => p.id === id)!;
    expect(sePuedeAgregar(porId('a1'))).toBe(true);
    expect(sePuedeAgregar(porId('e2'))).toBe(false);
    expect(sePuedeAgregar(porId('g1'))).toBe(false);
  });
});
