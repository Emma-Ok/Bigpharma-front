import { useEffect, useState } from 'preact/hooks';
import type { ProductoResumen } from '@/dominio/producto';

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
