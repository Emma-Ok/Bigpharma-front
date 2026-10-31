import { normalizarTexto } from './formato';

export const CATEGORIAS = [
  { id: 'dolor', nombre: 'Dolor y fiebre', sintomas: 'dolor cabeza fiebre muscular' },
  { id: 'gripa', nombre: 'Gripa y alergias', sintomas: 'gripa gripe alergia tos congestion nariz' },
  { id: 'estomago', nombre: 'Estómago', sintomas: 'estomago diarrea acidez gases agrieras' },
  { id: 'piel', nombre: 'Piel y cuidado', sintomas: 'piel sol cuidado personal' },
  { id: 'bebes', nombre: 'Bebés', sintomas: 'bebe panal' },
  { id: 'auxilios', nombre: 'Primeros auxilios', sintomas: 'herida curacion fiebre' },
  { id: 'formula', nombre: 'Con fórmula', sintomas: 'formula receta' },
] as const;

export type CategoriaId = (typeof CATEGORIAS)[number]['id'];
export const IDS_CATEGORIA = CATEGORIAS.map((c) => c.id) as [CategoriaId, ...CategoriaId[]];

export function categoria(id: CategoriaId) {
  return CATEGORIAS.find((c) => c.id === id)!;
}

export type Tipo = 'med' | 'cos' | 'dis';
export const TIPOS: Record<Tipo, string> = {
  med: 'Medicamento',
  cos: 'Cuidado personal',
  dis: 'Dispositivo médico',
};

export type Disponibilidad = 'disponible' | 'pocas' | 'agotado';

interface ProductoBase {
  id: string;
  slug: string;
  nombre: string;
  categoria: CategoriaId;
  tipo: Tipo;
  laboratorioMarca: string;
  principioActivo?: string;
  concentracion?: string;
  formaFarmaceutica?: string;
  presentacion: string;
  unidades?: number;
  unidad?: string;
  registroSanitario: string;
  disponibilidad: Disponibilidad;
  paraQueSirve: string;
  comoSeUsa: string;
  advertencias: string;
  fotos: string[];
}

export interface ProductoLibre extends ProductoBase {
  condicionVenta: 'libre';
  precio: number;
  precioAntes?: number;
  /** Calculado: porcentaje de ahorro frente a precioAntes, redondeado. */
  descuentoPct?: number;
  /** Calculado: precio ÷ unidades, redondeado. */
  precioPorUnidad?: number;
}

/** Con fórmula: nunca tiene precio ni se agrega al carrito. */
export interface ProductoFormula extends ProductoBase {
  condicionVenta: 'formula';
}

export type Producto = ProductoLibre | ProductoFormula;

/** Lo que necesitan la tarjeta, el buscador y el carrito en el navegador. */
export type ProductoResumen = Pick<
  ProductoBase,
  'id' | 'slug' | 'nombre' | 'categoria' | 'tipo' | 'presentacion' | 'disponibilidad'
> & {
  foto?: string;
} & (
    | { condicionVenta: 'libre'; precio: number; precioAntes?: number; descuentoPct?: number }
    | { condicionVenta: 'formula' }
  );

export function resumir(p: Producto): ProductoResumen {
  const base = {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    categoria: p.categoria,
    tipo: p.tipo,
    presentacion: p.presentacion,
    disponibilidad: p.disponibilidad,
    foto: p.fotos[0],
  };
  return p.condicionVenta === 'libre'
    ? {
        ...base,
        condicionVenta: 'libre',
        precio: p.precio,
        precioAntes: p.precioAntes,
        descuentoPct: p.descuentoPct,
      }
    : { ...base, condicionVenta: 'formula' };
}

/** Se puede agregar al pedido: venta libre y con existencias. */
export function sePuedeAgregar(
  p: ProductoResumen | Producto,
): p is Extract<ProductoResumen | Producto, { condicionVenta: 'libre' }> {
  return p.condicionVenta === 'libre' && p.disponibilidad !== 'agotado';
}

export function urlProducto(p: { slug: string }): string {
  return `/producto/${p.slug}`;
}

// ---------- Búsqueda, filtros y orden ----------

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
