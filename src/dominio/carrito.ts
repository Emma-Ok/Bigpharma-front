/**
 * Carrito en el navegador. Guarda solo { id, cantidad }: el nombre y el precio
 * se toman siempre del catálogo vigente, así un precio viejo nunca llega al pedido.
 */
import { sePuedeAgregar, type ProductoResumen } from './producto';

export const CANTIDAD_MAXIMA = 99;

export interface LineaCarrito {
  id: string;
  cantidad: number;
}

export type Carrito = readonly LineaCarrito[];

function limitar(cantidad: number): number {
  return Math.min(CANTIDAD_MAXIMA, Math.max(0, Math.floor(cantidad)));
}

export function cantidadDe(carrito: Carrito, id: string): number {
  return carrito.find((l) => l.id === id)?.cantidad ?? 0;
}

export function fijarCantidad(carrito: Carrito, id: string, cantidad: number): Carrito {
  const c = limitar(cantidad);
  if (c === 0) return carrito.filter((l) => l.id !== id);
  if (carrito.some((l) => l.id === id)) {
    return carrito.map((l) => (l.id === id ? { id, cantidad: c } : l));
  }
  return [...carrito, { id, cantidad: c }];
}

export function agregar(carrito: Carrito, id: string): Carrito {
  return fijarCantidad(carrito, id, cantidadDe(carrito, id) + 1);
}

export function quitarUno(carrito: Carrito, id: string): Carrito {
  return fijarCantidad(carrito, id, cantidadDe(carrito, id) - 1);
}

export function quitar(carrito: Carrito, id: string): Carrito {
  return fijarCantidad(carrito, id, 0);
}

/** Quita todos los productos del pedido. */
export function vaciar(_carrito: Carrito): Carrito {
  return [];
}

export function contarUnidades(carrito: readonly { cantidad: number }[]): number {
  return carrito.reduce((n, l) => n + l.cantidad, 0);
}

export interface LineaResuelta {
  producto: Extract<ProductoResumen, { condicionVenta: 'libre' }>;
  cantidad: number;
  subtotal: number;
}

/** Une el carrito con el catálogo y descarta lo que ya no se puede pedir. */
export function resolverLineas(carrito: Carrito, catalogo: ProductoResumen[]): LineaResuelta[] {
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const lineas: LineaResuelta[] = [];
  for (const l of carrito) {
    const p = porId.get(l.id);
    if (!p || !sePuedeAgregar(p)) continue;
    lineas.push({ producto: p, cantidad: l.cantidad, subtotal: p.precio * l.cantidad });
  }
  return lineas;
}

export function subtotal(lineas: LineaResuelta[]): number {
  return lineas.reduce((n, l) => n + l.subtotal, 0);
}
