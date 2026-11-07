import { describe, expect, it, vi } from 'vitest';
import { agregar, vaciar } from '@/dominio/carrito';
import { CLAVE_CARRITO, crearAlmacen, deserializar } from '../almacenCarrito';

function memoria() {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
}

describe('persistencia', () => {
  it('vacía el pedido guardado en el almacén', () => {
    const almacen = crearAlmacen(memoria());
    almacen.actualizar((c) => agregar(agregar(c, 'a1'), 'c1'));
    almacen.actualizar(vaciar);
    expect(almacen.leer()).toEqual([]);
  });

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
