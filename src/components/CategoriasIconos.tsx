import { CATEGORIAS, type CategoriaId } from '../lib/catalogo';
import Icono from './Icono';
import type { NombreIcono } from './iconos';
import { FONDO_CATEGORIA } from './estilosCategoria';

interface Props {
  seleccion?: CategoriaId;
  onElegir: (categoria?: CategoriaId) => void;
}

const OPCIONES: { id?: CategoriaId; nombre: string; icono: NombreIcono; fondo: string }[] = [
  { nombre: 'Todo', icono: 'cat-todo', fondo: FONDO_CATEGORIA.todo },
  ...CATEGORIAS.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    icono: `cat-${c.id}` as NombreIcono,
    fondo: FONDO_CATEGORIA[c.id],
  })),
];

/** Fila de botones circulares (aria-pressed). En celular se desliza horizontalmente. */
export default function CategoriasIconos({ seleccion, onElegir }: Props) {
  return (
    <div
      role="group"
      aria-label="Filtrar por categoría"
      class="-mx-margen flex gap-2.5 overflow-x-auto px-margen pt-1.5 pb-3.5"
    >
      {OPCIONES.map((c) => {
        const activa = seleccion === c.id;
        return (
          <button
            key={c.nombre}
            type="button"
            aria-pressed={activa}
            onClick={() => onElegir(c.id)}
            class="flex min-w-22 flex-[1_0_88px] cursor-pointer flex-col items-center gap-2 border-0 bg-transparent px-0.5 py-1 text-tinta"
          >
            <span
              aria-hidden="true"
              class={`anillo-categoria flex size-17.5 items-center justify-center rounded-full text-tinta transition-shadow duration-media ease-salida ${c.fondo} ${
                activa ? 'shadow-[0_0_0_3px_var(--color-azul)]' : 'shadow-[0_0_0_1px_var(--color-borde)]'
              }`}
            >
              <Icono nombre={c.icono} tamano={30} grosor={1.8} />
            </span>
            <span
              class={`text-center text-[13.5px] leading-tight font-medium ${
                activa ? 'text-azul underline decoration-2 underline-offset-4' : 'text-tinta'
              }`}
            >
              {c.nombre}
            </span>
          </button>
        );
      })}
    </div>
  );
}
