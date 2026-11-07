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
