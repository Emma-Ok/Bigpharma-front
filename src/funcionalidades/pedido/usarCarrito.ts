import { useEffect, useState } from 'preact/hooks';
import { carritoNavegador } from '@/funcionalidades/pedido/almacenCarrito';
import type { Carrito } from '@/dominio/carrito';

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
