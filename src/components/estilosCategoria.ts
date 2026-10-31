import type { CategoriaId } from '../lib/catalogo';

/** Clases completas (Tailwind solo genera las que aparecen escritas). */
export const FONDO_CATEGORIA: Record<CategoriaId | 'todo', string> = {
  dolor: 'bg-cat-dolor-fondo',
  gripa: 'bg-cat-gripa-fondo',
  estomago: 'bg-cat-estomago-fondo',
  piel: 'bg-cat-piel-fondo',
  bebes: 'bg-cat-bebes-fondo',
  auxilios: 'bg-cat-auxilios-fondo',
  formula: 'bg-cat-formula-fondo',
  todo: 'bg-cat-todo-fondo',
};

export const PUNTO_CATEGORIA: Record<CategoriaId | 'todo', string> = {
  dolor: 'bg-cat-dolor',
  gripa: 'bg-cat-gripa',
  estomago: 'bg-cat-estomago',
  piel: 'bg-cat-piel',
  bebes: 'bg-cat-bebes',
  auxilios: 'bg-cat-auxilios',
  formula: 'bg-cat-formula',
  todo: 'bg-cat-todo',
};

export const RELLENO_CATEGORIA: Record<CategoriaId, string> = {
  dolor: 'fill-cat-dolor',
  gripa: 'fill-cat-gripa',
  estomago: 'fill-cat-estomago',
  piel: 'fill-cat-piel',
  bebes: 'fill-cat-bebes',
  auxilios: 'fill-cat-auxilios',
  formula: 'fill-cat-formula',
};
