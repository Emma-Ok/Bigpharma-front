import { describe, expect, it } from 'vitest';
import {
  agregar,
  contarUnidades,
  fijarCantidad,
  quitar,
  quitarUno,
  resolverLineas,
  subtotal,
  vaciar,
  type Carrito,
} from '../carrito';
import { progresoDomicilio } from '../domicilio';
import type { ProductoResumen } from '../producto';

const base = { categoria: 'dolor', tipo: 'med', presentacion: 'Caja', disponibilidad: 'disponible' } as const;
const catalogo: ProductoResumen[] = [
  { ...base, id: 'a1', slug: 'a1', nombre: 'Acetaminofén', condicionVenta: 'libre', precio: 3500 },
  { ...base, id: 'e2', slug: 'e2', nombre: 'Crema', condicionVenta: 'libre', precio: 15600, disponibilidad: 'agotado' },
  { ...base, id: 'g1', slug: 'g1', nombre: 'Amoxicilina', categoria: 'formula', condicionVenta: 'formula' },
];

describe('operaciones', () => {
  it('agrega, suma, resta y quita', () => {
    let c: Carrito = [];
    c = agregar(c, 'a1');
    c = agregar(c, 'a1');
    c = agregar(c, 'c1');
    expect(c).toEqual([
      { id: 'a1', cantidad: 2 },
      { id: 'c1', cantidad: 1 },
    ]);
    c = quitarUno(c, 'c1');
    expect(c).toEqual([{ id: 'a1', cantidad: 2 }]);
    expect(contarUnidades(c)).toBe(2);
    expect(quitar(c, 'a1')).toEqual([]);
  });

  it('vacía el pedido completo', () => {
    expect(vaciar([{ id: 'a1', cantidad: 2 }, { id: 'c1', cantidad: 1 }])).toEqual([]);
  });

  it('limita la cantidad entre 0 y 99', () => {
    expect(fijarCantidad([], 'a1', 250)).toEqual([{ id: 'a1', cantidad: 99 }]);
    expect(fijarCantidad([{ id: 'a1', cantidad: 3 }], 'a1', -4)).toEqual([]);
  });

  it('resuelve líneas con el catálogo vigente y descarta fórmula, agotados e inexistentes', () => {
    const lineas = resolverLineas(
      [
        { id: 'a1', cantidad: 2 },
        { id: 'e2', cantidad: 1 },
        { id: 'g1', cantidad: 1 },
        { id: 'zz', cantidad: 1 },
      ],
      catalogo,
    );
    expect(lineas.map((l) => [l.producto.id, l.subtotal])).toEqual([['a1', 7000]]);
    expect(subtotal(lineas)).toBe(7000);
  });

  it('calcula el progreso hacia el domicilio gratis', () => {
    expect(progresoDomicilio(13200, 60000)).toEqual({ falta: 46800, porcentaje: 22, gratis: false });
    expect(progresoDomicilio(70000, 60000)).toEqual({ falta: 0, porcentaje: 100, gratis: true });
    expect(progresoDomicilio(0, 0).gratis).toBe(true);
  });
});
