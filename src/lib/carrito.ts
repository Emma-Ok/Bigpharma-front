/**
 * Carrito en el navegador. Guarda solo { id, cantidad }: el nombre y el precio
 * se toman siempre del catálogo vigente, así un precio viejo nunca llega al pedido.
 */
import { sePuedeAgregar, type ProductoResumen } from './catalogo';

export const CLAVE_CARRITO = 'carrito:v1';
export const CANTIDAD_MAXIMA = 99;

export interface LineaCarrito {
  id: string;
  cantidad: number;
}

export type Carrito = readonly LineaCarrito[];

// ---------- Operaciones puras ----------

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

export interface ProgresoDomicilio {
  falta: number;
  porcentaje: number;
  gratis: boolean;
}

export function progresoDomicilio(total: number, umbral: number): ProgresoDomicilio {
  if (umbral <= 0) return { falta: 0, porcentaje: 100, gratis: true };
  const falta = Math.max(0, umbral - total);
  return {
    falta,
    porcentaje: Math.min(100, Math.round((total / umbral) * 100)),
    gratis: falta === 0,
  };
}

// ---------- Persistencia ----------

/** Acepta solo arreglos de { id: string, cantidad: entero > 0 }; lo demás se descarta. */
export function deserializar(texto: string | null): Carrito {
  if (!texto) return [];
  try {
    const datos: unknown = JSON.parse(texto);
    if (!Array.isArray(datos)) return [];
    let carrito: Carrito = [];
    for (const l of datos) {
      if (l && typeof l.id === 'string' && typeof l.cantidad === 'number' && l.cantidad > 0) {
        carrito = fijarCantidad(carrito, l.id, l.cantidad);
      }
    }
    return carrito;
  } catch {
    return [];
  }
}

type Almacenamiento = Pick<Storage, 'getItem' | 'setItem'>;
type Oyente = (carrito: Carrito) => void;

export interface AlmacenCarrito {
  leer(): Carrito;
  actualizar(cambio: (carrito: Carrito) => Carrito): Carrito;
  suscribir(oyente: Oyente): () => void;
  /** Vuelve a leer el almacenamiento (cambio desde otra pestaña). */
  recargar(): void;
}

/**
 * Si el almacenamiento no existe o falla (modo privado, cuota llena),
 * el carrito sigue funcionando en memoria durante la visita.
 */
export function crearAlmacen(almacenamiento?: Almacenamiento | null): AlmacenCarrito {
  const oyentes = new Set<Oyente>();
  const leerAlmacenamiento = (): Carrito => {
    try {
      return deserializar(almacenamiento?.getItem(CLAVE_CARRITO) ?? null);
    } catch {
      return [];
    }
  };
  let estado = leerAlmacenamiento();
  const avisar = () => oyentes.forEach((o) => o(estado));

  return {
    leer: () => estado,
    actualizar(cambio) {
      estado = cambio(estado);
      try {
        almacenamiento?.setItem(CLAVE_CARRITO, JSON.stringify(estado));
      } catch {
        // Sin almacenamiento: el carrito vive solo en memoria.
      }
      avisar();
      return estado;
    },
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    recargar() {
      estado = leerAlmacenamiento();
      avisar();
    },
  };
}

let almacenNavegador: AlmacenCarrito | undefined;

/** Almacén único compartido por todas las islas de la página (y entre páginas con ClientRouter). */
export function carritoNavegador(): AlmacenCarrito {
  if (almacenNavegador) return almacenNavegador;
  let ls: Storage | null = null;
  try {
    ls = typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    ls = null;
  }
  const almacen = crearAlmacen(ls);
  almacenNavegador = almacen;
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === CLAVE_CARRITO) almacen.recargar();
    });
  }
  return almacen;
}
