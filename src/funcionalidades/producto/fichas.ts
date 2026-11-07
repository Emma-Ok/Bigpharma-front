import type { Producto } from '@/dominio/producto';

const fichas = new Map<string, Promise<Producto>>();

/** Pide la ficha antes del clic (al pasar el puntero o enfocar), para abrirla sin espera. */
export function precargarFicha(slug: string) {
  cargarFicha(slug).catch(() => fichas.delete(slug));
}

export function cargarFicha(slug: string): Promise<Producto> {
  if (!fichas.has(slug)) {
    fichas.set(
      slug,
      fetch(`/producto/${slug}.json`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Producto>;
      }),
    );
  }
  return fichas.get(slug)!;
}
