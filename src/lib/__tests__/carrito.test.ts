import { describe, expect, it, vi } from 'vitest';
import {
  CLAVE_CARRITO,
  agregar,
  contarUnidades,
  crearAlmacen,
  deserializar,
  fijarCantidad,
  progresoDomicilio,
  quitar,
  quitarUno,
  resolverLineas,
  subtotal,
  vaciar,
  type Carrito,
} from '../carrito';
import type { ProductoResumen } from '../catalogo';

const base = { categoria: 'dolor', tipo: 'med', presentacion: 'Caja', disponibilidad: 'disponible' } as const;
const catalogo: ProductoResumen[] = [
  { ...base, id: 'a1', slug: 'a1', nombre: 'Acetaminofén', condicionVenta: 'libre', precio: 3500 },
  { ...base, id: 'e2', slug: 'e2', nombre: 'Crema', condicionVenta: 'libre', precio: 15600, disponibilidad: 'agotado' },
  { ...base, id: 'g1', slug: 'g1', nombre: 'Amoxicilina', categoria: 'formula', condicionVenta: 'formula' },
];

function memoria() {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
}

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
    const almacen = crearAlmacen(memoria());
    almacen.actualizar((c) => agregar(agregar(c, 'a1'), 'c1'));
    almacen.actualizar(vaciar);
    expect(almacen.leer()).toEqual([]);
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

describe('persistencia', () => {
  it('descarta JSON corrupto o con forma inválida', () => {
    expect(deserializar('{no es json')).toEqual([]);
    expect(deserializar('{"a1":2}')).toEqual([]);
    expect(deserializar('[{"id":"a1","cantidad":2},{"id":3},{"id":"b","cantidad":-1}]')).toEqual([
      { id: 'a1', cantidad: 2 },
    ]);
  });

  it('guarda y vuelve a leer del almacenamiento', () => {
    const ls = memoria();
    const almacen = crearAlmacen(ls);
    almacen.actualizar((c) => agregar(c, 'a1'));
    expect(JSON.parse(ls.datos.get(CLAVE_CARRITO)!)).toEqual([{ id: 'a1', cantidad: 1 }]);
    expect(crearAlmacen(ls).leer()).toEqual([{ id: 'a1', cantidad: 1 }]);
  });

  it('sigue funcionando en memoria si el almacenamiento falla', () => {
    const roto = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const almacen = crearAlmacen(roto);
    expect(almacen.leer()).toEqual([]);
    almacen.actualizar((c) => agregar(c, 'a1'));
    expect(almacen.leer()).toEqual([{ id: 'a1', cantidad: 1 }]);
    expect(crearAlmacen(null).leer()).toEqual([]);
  });

  it('avisa a los suscriptores y recarga cambios de otra pestaña', () => {
    const ls = memoria();
    const almacen = crearAlmacen(ls);
    const oyente = vi.fn();
    const cancelar = almacen.suscribir(oyente);
    almacen.actualizar((c) => agregar(c, 'a1'));
    expect(oyente).toHaveBeenLastCalledWith([{ id: 'a1', cantidad: 1 }]);

    ls.setItem(CLAVE_CARRITO, '[{"id":"a1","cantidad":5}]');
    almacen.recargar();
    expect(oyente).toHaveBeenLastCalledWith([{ id: 'a1', cantidad: 5 }]);

    cancelar();
    almacen.actualizar((c) => agregar(c, 'a1'));
    expect(oyente).toHaveBeenCalledTimes(2);
  });
});
