import { useEffect, useState } from 'preact/hooks';
import { carritoNavegador } from '@/funcionalidades/pedido/almacenCarrito';
import type { Carrito } from '@/dominio/carrito';
import type { ProductoResumen } from '@/dominio/producto';

/** Carrito compartido entre islas. En el servidor (y antes de hidratar) está vacío. */
export function usarCarrito(): Carrito {
  const [carrito, setCarrito] = useState<Carrito>([]);
  useEffect(() => {
    const almacen = carritoNavegador();
    setCarrito(almacen.leer());
    return almacen.suscribir(setCarrito);
  }, []);
  return carrito;
}

let catalogo: Promise<ProductoResumen[]> | undefined;

/** Catálogo resumido de /productos.json, descargado una sola vez por visita. */
export function cargarCatalogo(): Promise<ProductoResumen[]> {
  catalogo ??= fetch('/productos.json')
    .then((r) => (r.ok ? (r.json() as Promise<ProductoResumen[]>) : []))
    .catch(() => {
      catalogo = undefined;
      return [];
    });
  return catalogo;
}

export function usarCatalogo(inicial?: ProductoResumen[]): ProductoResumen[] | undefined {
  const [lista, setLista] = useState(inicial);
  useEffect(() => {
    if (inicial) return;
    let vigente = true;
    cargarCatalogo().then((l) => vigente && setLista(l));
    return () => {
      vigente = false;
    };
  }, [inicial]);
  return lista;
}
