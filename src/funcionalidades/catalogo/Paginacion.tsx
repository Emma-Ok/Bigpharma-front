import Icono from '@/compartido/ui/Icono';

interface Props {
  pagina: number;
  paginas: number;
  onIr: (pagina: number) => void;
}

const FLECHA =
  'flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-bottle bg-blanco text-bottle disabled:cursor-default disabled:border-muted/40 disabled:text-muted';

export default function Paginacion({ pagina, paginas, onIr }: Props) {
  return (
    <nav aria-label="Páginas del catálogo">
      <ul class="m-0 flex list-none flex-wrap items-center justify-center gap-1.5 p-0">
        <li>
          <button type="button" disabled={pagina === 1} onClick={() => onIr(pagina - 1)} aria-label="Página anterior" class={FLECHA}>
            <Icono nombre="anterior" tamano={18} grosor={2.4} />
          </button>
        </li>
        {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => onIr(n)}
              aria-label={`Página ${n}`}
              aria-current={n === pagina ? 'page' : undefined}
              class={`flex size-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold ${
                n === pagina ? 'border-0 bg-bottle text-blanco' : 'border border-muted/40 bg-blanco text-ink'
              }`}
            >
              {n}
            </button>
          </li>
        ))}
        <li>
          <button type="button" disabled={pagina === paginas} onClick={() => onIr(pagina + 1)} aria-label="Página siguiente" class={FLECHA}>
            <Icono nombre="siguiente" tamano={18} grosor={2.4} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
