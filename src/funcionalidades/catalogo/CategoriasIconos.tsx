import { CATEGORIAS, type CategoriaId } from '@/dominio/categorias';
import Icono from '@/compartido/ui/Icono';
import type { NombreIcono } from '@/compartido/ui/iconos';
import { FONDO_CATEGORIA } from '@/compartido/ui/estilosCategoria';

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
            class="flex min-w-22 flex-[1_0_88px] cursor-pointer flex-col items-center gap-2 border-0 bg-transparent px-0.5 py-1 text-ink"
          >
            <span
              aria-hidden="true"
              class={`anillo-categoria flex size-17.5 items-center justify-center rounded-full transition-colors duration-media ease-salida ${
                activa ? 'bg-bottle text-blanco' : `${c.fondo} text-ink`
              }`}
            >
              <Icono nombre={c.icono} tamano={30} grosor={1.8} />
            </span>
            <span
              class={`text-center text-[13.5px] leading-tight font-medium ${
                activa ? 'text-bottle underline decoration-2 underline-offset-4' : 'text-ink'
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
