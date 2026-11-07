import type { CategoriaId, Tipo } from './categorias';

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

export type Forma = 'caja' | 'frasco' | 'tubo' | 'paquete';

export function formaDe(presentacion: string, categoria: CategoriaId): Forma {
  if (categoria === 'formula' || /^caja/i.test(presentacion)) return 'caja';
  if (/^(frasco|botella)/i.test(presentacion)) return 'frasco';
  if (/^tubo/i.test(presentacion)) return 'tubo';
  return 'paquete';
}
