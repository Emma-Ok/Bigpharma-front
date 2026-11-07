import { IDS_CATEGORIA, type CategoriaId } from '../lib/catalogo';

/** Valor común para todas las categorías; la de fórmula lleva amber. */
function porCategoria<T>(general: T, formula: T) {
  return Object.fromEntries(IDS_CATEGORIA.map((id) => [id, id === 'formula' ? formula : general])) as Record<CategoriaId, T>;
}

/** Clases completas (Tailwind solo genera las que aparecen escritas). */
export const FONDO_CATEGORIA: Record<CategoriaId | 'todo', string> = { ...porCategoria('bg-celadon', 'bg-celadon'), todo: 'bg-celadon' };

export const PUNTO_CATEGORIA: Record<CategoriaId | 'todo', string> = { ...porCategoria('bg-bottle', 'bg-amber'), todo: 'bg-muted' };

export const RELLENO_CATEGORIA = porCategoria('fill-bottle', 'fill-amber');

/** Los mismos colores en hex, para las escenas 3D (WebGL no lee variables de CSS). */
export const HEX_CATEGORIA = porCategoria({ color: '#133B34', fondo: '#D5E5DB' }, { color: '#A8621A', fondo: '#D5E5DB' });
