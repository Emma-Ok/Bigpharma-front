import { ORDENES, type Orden } from './busqueda';
import { IDS_CATEGORIA, TIPOS, type CategoriaId, type Tipo } from './categorias';

export interface FiltrosCatalogo {
  q: string;
  categoria?: CategoriaId;
  tipo?: Tipo;
  descuento: boolean;
  orden: Orden;
  pagina: number;
}

export const FILTROS_INICIALES: FiltrosCatalogo = { q: '', descuento: false, orden: 'relevancia', pagina: 1 };

/** Filtros desde la consulta de la URL («?categoria=piel&descuento=1»). Ignora los valores que no existen. */
export function leerFiltros(consulta: string): FiltrosCatalogo {
  const p = new URLSearchParams(consulta);
  const categoria = p.get('categoria') as CategoriaId | null;
  const tipo = p.get('tipo') as Tipo | null;
  const orden = p.get('orden') as Orden | null;
  return {
    q: p.get('q') ?? '',
    categoria: categoria && IDS_CATEGORIA.includes(categoria) ? categoria : undefined,
    tipo: tipo && tipo in TIPOS ? tipo : undefined,
    descuento: p.get('descuento') === '1',
    orden: orden && orden in ORDENES ? orden : 'relevancia',
    pagina: Math.max(1, Number.parseInt(p.get('pagina') ?? '1', 10) || 1),
  };
}

/** Consulta de la URL sin el «?». Vacía con los filtros iniciales. */
export function escribirFiltros(f: FiltrosCatalogo): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.categoria) p.set('categoria', f.categoria);
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.descuento) p.set('descuento', '1');
  if (f.orden !== 'relevancia') p.set('orden', f.orden);
  if (f.pagina > 1) p.set('pagina', String(f.pagina));
  return p.toString();
}

/** Cuántos filtros del botón «Filtros» están activos: tipo, descuento y orden. */
export function contarFiltrosPanel(f: FiltrosCatalogo): number {
  return [f.tipo, f.descuento, f.orden !== 'relevancia'].filter(Boolean).length;
}
