import { ORDENES, type Orden } from '@/dominio/busqueda';
import { TIPOS, type Tipo } from '@/dominio/categorias';
import type { FiltrosCatalogo } from '@/dominio/filtrosCatalogo';
import Boton from '@/compartido/ui/Boton';

interface Props {
  filtros: FiltrosCatalogo;
  total: number;
  hayFiltros: boolean;
  onCambiar: (parcial: Partial<FiltrosCatalogo>) => void;
  onBorrar: () => void;
  onVer: () => void;
}

/** Tipo, descuento y orden. Va dentro de una hoja inferior; las categorías están en los íconos. */
export default function PanelFiltros({ filtros, total, hayFiltros, onCambiar, onBorrar, onVer }: Props) {
  return (
    <div class="flex flex-col gap-5">
      <fieldset class="m-0 border-0 p-0">
        <legend class="mb-1 p-0 text-base font-semibold">Tipo de producto</legend>
        {([undefined, ...(Object.keys(TIPOS) as Tipo[])] as const).map((t) => (
          <label key={t ?? 'todos'} class="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
            <input type="radio" name="tipo" checked={filtros.tipo === t} onChange={() => onCambiar({ tipo: t })} class="size-4.5 accent-bottle" />
            {t ? TIPOS[t] : 'Todos'}
          </label>
        ))}
      </fieldset>
      <label class="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-medium">
        <input
          type="checkbox"
          checked={filtros.descuento}
          onChange={(e) => onCambiar({ descuento: e.currentTarget.checked })}
          class="size-4.5 accent-bottle"
        />
        Solo productos con descuento
      </label>
      <div class="flex flex-col gap-1.5">
        <label htmlFor="orden" class="text-base font-semibold">
          Ordenar por
        </label>
        <select
          id="orden"
          value={filtros.orden}
          onChange={(e) => onCambiar({ orden: e.currentTarget.value as Orden })}
          class="min-h-11 cursor-pointer rounded-boton border-2 border-muted bg-blanco px-3 text-[15px] text-ink"
        >
          {Object.entries(ORDENES).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <Boton tamano="compacto" onClick={onVer}>
          {total === 1 ? 'Ver 1 producto' : `Ver ${total} productos`}
        </Boton>
        {hayFiltros && (
          <button
            type="button"
            onClick={onBorrar}
            class="min-h-11 cursor-pointer border-0 bg-transparent text-[15px] font-semibold text-bottle underline underline-offset-4"
          >
            Borrar filtros
          </button>
        )}
      </div>
    </div>
  );
}
