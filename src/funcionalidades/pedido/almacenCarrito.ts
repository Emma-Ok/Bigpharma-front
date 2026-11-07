/** Persistencia del carrito en localStorage y almacén compartido entre islas. */
import { fijarCantidad, type Carrito } from '@/dominio/carrito';

export const CLAVE_CARRITO = 'carrito:v1';

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
