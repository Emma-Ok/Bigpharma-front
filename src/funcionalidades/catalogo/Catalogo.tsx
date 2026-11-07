import { useMemo, useRef, useState } from 'preact/hooks';
import { buscar, filtrar, paginar } from '@/dominio/busqueda';
import { contarFiltrosPanel } from '@/dominio/filtrosCatalogo';
import type { ProductoResumen } from '@/dominio/producto';
import type { Tienda } from '@/dominio/sitio';
import Boton from '@/compartido/ui/Boton';
import HojaInferior from '@/compartido/ui/HojaInferior';
import Icono from '@/compartido/ui/Icono';
import DialogoFicha from '@/funcionalidades/producto/DialogoFicha';
import TarjetaProducto from '@/funcionalidades/producto/TarjetaProducto';
import { usarVistaRapida } from '@/funcionalidades/producto/usarVistaRapida';
import CategoriasIconos from './CategoriasIconos';
import ConPanelPedido, { GRILLA } from './ConPanelPedido';
import Paginacion from './Paginacion';
import PanelFiltros from './PanelFiltros';
import SinResultados from './SinResultados';
import { usarFiltrosCatalogo } from './usarFiltrosCatalogo';

/** Múltiplo de 2 y de 3: las filas quedan completas en las dos grillas. */
export const POR_PAGINA = 18;

interface Props {
  productos: ProductoResumen[];
  tienda: Tienda;
}

export default function Catalogo({ productos, tienda }: Props) {
  const { filtros, cambiar, borrar, irAPagina } = usarFiltrosCatalogo();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const rapida = usarVistaRapida();
  const rango = useRef<HTMLParagraphElement>(null);

  const base = useMemo(() => (filtros.q.trim() ? buscar(productos, filtros.q) : productos), [productos, filtros.q]);
  const lista = useMemo(
    () => filtrar(base, { tipo: filtros.tipo, soloDescuento: filtros.descuento, categoria: filtros.categoria, orden: filtros.orden }),
    [base, filtros.tipo, filtros.descuento, filtros.categoria, filtros.orden],
  );
  const { items, pagina, paginas } = paginar(lista, filtros.pagina, POR_PAGINA);
  const desde = lista.length ? (pagina - 1) * POR_PAGINA + 1 : 0;
  const hasta = Math.min(pagina * POR_PAGINA, lista.length);
  const activos = contarFiltrosPanel(filtros);
  const hayFiltros = !!(filtros.q || filtros.categoria || filtros.tipo || filtros.descuento);

  const alIrAPagina = (n: number) => {
    irAPagina(n);
    rango.current?.scrollIntoView({ block: 'start' });
    rango.current?.focus({ preventScroll: true });
  };

  return (
    <div class="flex flex-col gap-4">
      {/* Debajo de 1200 px la fila se disuelve (contents): así la búsqueda es sticky en todo el catálogo. */}
      <div class="contents lg:flex lg:items-center lg:justify-between lg:gap-8">
        <h1 class="m-0 text-[clamp(28px,3vw,38px)] leading-tight font-semibold text-bottle">Catálogo</h1>
        <form
          role="search"
          id="buscar"
          onSubmit={(e) => e.preventDefault()}
          class="sticky top-0 z-20 -mx-margen bg-paper px-margen py-2 lg:static lg:m-0 lg:w-120 lg:p-0"
        >
          <label htmlFor="q-catalogo" class="visualmente-oculto">
            Busca por nombre o síntoma
          </label>
          <div class="flex h-13 overflow-hidden rounded-[14px] border-2 border-muted bg-blanco focus-within:border-bottle">
            <input
              id="q-catalogo"
              type="search"
              value={filtros.q}
              onInput={(e) => cambiar({ q: e.currentTarget.value })}
              placeholder="Busca por nombre o síntoma"
              autoComplete="off"
              aria-controls="resultados"
              class="min-w-0 flex-1 border-0 bg-transparent px-4 text-base text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              aria-label="Buscar"
              class="flex w-14 shrink-0 cursor-pointer items-center justify-center border-0 border-l border-celadon bg-celadon text-bottle"
            >
              <Icono nombre="lupa" tamano={22} grosor={2.2} />
            </button>
          </div>
        </form>
      </div>

      <CategoriasIconos seleccion={filtros.categoria} onElegir={(c) => cambiar({ categoria: c }, true)} />

      <ConPanelPedido umbral={tienda.umbral} productos={productos}>
        <div class="flex items-center justify-between gap-3">
          <p ref={rango} tabIndex={-1} aria-live="polite" id="resultados-rango" class="m-0 text-[15px] text-muted focus:outline-none">
            {lista.length
              ? `Mostrando ${desde}–${hasta} de ${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`
              : 'No hay productos con esos filtros'}
          </p>
          <Boton variante="secundario" tamano="compacto" class="shrink-0" aria-haspopup="dialog" onClick={() => setPanelAbierto(true)}>
            <Icono nombre="menu" tamano={18} />
            {activos ? `Filtros (${activos})` : 'Filtros'}
          </Boton>
        </div>

        <div id="resultados" class="flex flex-col gap-6">
          {!lista.length && <SinResultados consulta={filtros.q} whatsapp={tienda.whatsapp} onBorrar={() => borrar()} />}
          <ul class={GRILLA}>
            {items.map((p) => (
              <li key={p.id} class="flex min-w-0" data-vt-tarjeta style={`--vt-tarjeta: tarjeta-${p.id}`}>
                <TarjetaProducto producto={p} whatsapp={tienda.whatsapp} nivel={2} {...rapida.tarjeta(p)} />
              </li>
            ))}
          </ul>
          {paginas > 1 && <Paginacion pagina={pagina} paginas={paginas} onIr={alIrAPagina} />}
        </div>
      </ConPanelPedido>

      <HojaInferior
        id="panel-filtros"
        abierta={panelAbierto}
        titulo="Filtros"
        etiquetaCerrar="Cerrar filtros"
        onCerrar={() => setPanelAbierto(false)}
      >
        <PanelFiltros
          filtros={filtros}
          total={lista.length}
          hayFiltros={hayFiltros}
          // Sin transición: se pintaría por encima de la hoja, que está en la capa superior.
          onCambiar={(parcial) => cambiar(parcial)}
          onBorrar={() => borrar(false)}
          onVer={() => setPanelAbierto(false)}
        />
      </HojaInferior>

      <DialogoFicha {...rapida.dialogo} tienda={tienda} />
    </div>
  );
}
