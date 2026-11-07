import { IDS_CATEGORIA, categoria, type CategoriaId, type Tipo } from './categorias';
import { normalizarTexto } from './formato';
import type { ProductoResumen } from './producto';

const PALABRAS_VACIAS = new Set(['de', 'la', 'el', 'y', 'para', 'con', 'los', 'las', 'del', 'en', 'a', 'por']);

export function terminosDeBusqueda(consulta: string): string[] {
  return normalizarTexto(consulta)
    .split(/\s+/)
    .filter((t) => t && !PALABRAS_VACIAS.has(t));
}

/** Búsqueda sin tildes por nombre, categoría y síntomas de la categoría. */
export function buscar<T extends ProductoResumen>(productos: T[], consulta: string): T[] {
  const terminos = terminosDeBusqueda(consulta);
  if (!terminos.length) return [];
  return productos
    .filter((p) => {
      const c = categoria(p.categoria);
      const texto = normalizarTexto(`${p.nombre} ${c.nombre} ${c.sintomas}`);
      return terminos.every((t) => texto.includes(t));
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export const ORDENES = {
  relevancia: 'Destacados',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
  nombre: 'Nombre (A-Z)',
} as const;
export type Orden = keyof typeof ORDENES;

export interface Filtros {
  categoria?: CategoriaId;
  tipo?: Tipo;
  soloDescuento?: boolean;
  orden?: Orden;
}

function precioDe(p: ProductoResumen): number {
  return p.condicionVenta === 'libre' ? p.precio : Number.POSITIVE_INFINITY;
}

function tieneDescuento(p: ProductoResumen): boolean {
  return p.condicionVenta === 'libre' && !!p.descuentoPct;
}

/** «Destacados»: primero con descuento, luego disponibles, luego por nombre. */
function compararRelevancia(a: ProductoResumen, b: ProductoResumen): number {
  const da = tieneDescuento(a) ? 1 : 0;
  const db = tieneDescuento(b) ? 1 : 0;
  if (da !== db) return db - da;
  const aa = a.disponibilidad === 'agotado' ? 1 : 0;
  const ab = b.disponibilidad === 'agotado' ? 1 : 0;
  if (aa !== ab) return aa - ab;
  return a.nombre.localeCompare(b.nombre, 'es');
}

export function filtrar<T extends ProductoResumen>(productos: T[], f: Filtros): T[] {
  const lista = productos.filter(
    (p) =>
      (!f.categoria || p.categoria === f.categoria) &&
      (!f.tipo || p.tipo === f.tipo) &&
      (!f.soloDescuento || tieneDescuento(p)),
  );
  const orden = f.orden ?? 'relevancia';
  return lista.sort((a, b) => {
    if (orden === 'precio-asc') return precioDe(a) - precioDe(b) || compararRelevancia(a, b);
    if (orden === 'precio-desc') {
      const pa = a.condicionVenta === 'libre' ? a.precio : -1;
      const pb = b.condicionVenta === 'libre' ? b.precio : -1;
      return pb - pa || compararRelevancia(a, b);
    }
    if (orden === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
    return compararRelevancia(a, b);
  });
}

/** Conteo por categoría con los demás filtros aplicados (para los filtros del catálogo). */
export function contarPorCategoria(
  productos: ProductoResumen[],
  f: Omit<Filtros, 'categoria' | 'orden'>,
): Record<CategoriaId, number> {
  const conteo = Object.fromEntries(IDS_CATEGORIA.map((id) => [id, 0])) as Record<CategoriaId, number>;
  for (const p of filtrar(productos, f)) conteo[p.categoria]++;
  return conteo;
}

export function paginar<T>(lista: T[], pagina: number, porPagina: number) {
  const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const actual = Math.min(Math.max(1, pagina), paginas);
  return {
    items: lista.slice((actual - 1) * porPagina, actual * porPagina),
    pagina: actual,
    paginas,
  };
}
