import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  buscar,
  CATEGORIAS,
  contarPorCategoria,
  filtrar,
  IDS_CATEGORIA,
  ORDENES,
  paginar,
  TIPOS,
  type CategoriaId,
  type Orden,
  type ProductoResumen,
  type Tipo,
} from '../lib/catalogo';
import { enlaceWhatsApp, mensajeBusqueda, MENSAJE_GENERAL } from '../lib/whatsapp';
import DialogoFicha, { precargarFicha } from './DialogoFicha';
import Icono from './Icono';
import TarjetaProducto from './TarjetaProducto';
import { PUNTO_CATEGORIA } from './estilosCategoria';
import { cambiarConTransicion } from './movimiento';

export const POR_PAGINA = 20;

interface Estado {
  q: string;
  categoria?: CategoriaId;
  tipo?: Tipo;
  descuento: boolean;
  orden: Orden;
  pagina: number;
}

const INICIAL: Estado = { q: '', descuento: false, orden: 'relevancia', pagina: 1 };

function leerUrl(): Estado {
  const p = new URLSearchParams(window.location.search);
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

function escribirUrl(e: Estado) {
  const p = new URLSearchParams();
  if (e.q.trim()) p.set('q', e.q.trim());
  if (e.categoria) p.set('categoria', e.categoria);
  if (e.tipo) p.set('tipo', e.tipo);
  if (e.descuento) p.set('descuento', '1');
  if (e.orden !== 'relevancia') p.set('orden', e.orden);
  if (e.pagina > 1) p.set('pagina', String(e.pagina));
  const texto = p.toString();
  // Conserva history.state para no confundir al router de Astro.
  history.replaceState(history.state, '', `${window.location.pathname}${texto ? `?${texto}` : ''}`);
}

interface Props {
  productos: ProductoResumen[];
  whatsapp: string;
  entrega: string;
}

export default function Catalogo({ productos, whatsapp, entrega }: Props) {
  const [estado, setEstado] = useState<Estado>(INICIAL);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const botonFiltros = useRef<HTMLButtonElement>(null);
  const panelFiltros = useRef<HTMLDivElement>(null);
  const cerrarFiltros = (devolverFoco: boolean) => {
    setFiltrosAbiertos(false);
    if (devolverFoco) botonFiltros.current?.focus();
  };

  // En celular el panel de filtros se superpone: se cierra con Esc o con un toque fuera de él.
  useEffect(() => {
    if (!filtrosAbiertos) return;
    const alTocar = (e: PointerEvent) => {
      const objetivo = e.target as Node;
      if (!panelFiltros.current?.contains(objetivo) && !botonFiltros.current?.contains(objetivo)) cerrarFiltros(false);
    };
    document.addEventListener('pointerdown', alTocar);
    return () => document.removeEventListener('pointerdown', alTocar);
  }, [filtrosAbiertos]);
  const [vista, setVista] = useState<{ producto: ProductoResumen; origen: HTMLElement } | null>(null);
  const [mostrando, setMostrando] = useState<string | null>(null);
  const rango = useRef<HTMLParagraphElement>(null);
  const listo = useRef(false);

  useEffect(() => {
    setEstado(leerUrl());
    listo.current = true;
  }, []);

  useEffect(() => {
    if (listo.current) escribirUrl(estado);
  }, [estado]);

  const cambiar = (parcial: Partial<Estado>, conTransicion = false) => {
    const aplicar = () => setEstado((e) => ({ ...e, pagina: 1, ...parcial }));
    if (conTransicion) cambiarConTransicion(aplicar);
    else aplicar();
  };

  const base = useMemo(
    () => (estado.q.trim() ? buscar(productos, estado.q) : productos),
    [productos, estado.q],
  );
  const filtros = { tipo: estado.tipo, soloDescuento: estado.descuento };
  const conteo = useMemo(() => contarPorCategoria(base, filtros), [base, estado.tipo, estado.descuento]);
  const lista = useMemo(
    () => filtrar(base, { ...filtros, categoria: estado.categoria, orden: estado.orden }),
    [base, estado.tipo, estado.descuento, estado.categoria, estado.orden],
  );
  const { items, pagina, paginas } = paginar(lista, estado.pagina, POR_PAGINA);
  const desde = lista.length ? (pagina - 1) * POR_PAGINA + 1 : 0;
  const hasta = Math.min(pagina * POR_PAGINA, lista.length);
  const hayFiltros = !!(estado.q || estado.categoria || estado.tipo || estado.descuento);
  const totalFiltros = [estado.categoria, estado.tipo, estado.descuento].filter(Boolean).length;

  const irAPagina = (n: number) => {
    setEstado((e) => ({ ...e, pagina: n }));
    rango.current?.scrollIntoView({ block: 'start' });
    rango.current?.focus({ preventScroll: true });
  };

  const cerrarVista = useCallback(() => {
    setVista(null);
    setMostrando(null);
  }, []);

  return (
    <div class="flex flex-col gap-4">
      <p
        ref={rango}
        tabIndex={-1}
        aria-live="polite"
        class="m-0 text-[15px] text-texto-2 focus:outline-none"
        id="resultados-rango"
      >
        {lista.length
          ? `Mostrando ${desde}–${hasta} de ${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`
          : 'No hay productos con esos filtros'}
      </p>

      <form
        role="search"
        id="buscar"
        onSubmit={(e) => e.preventDefault()}
        class="flex flex-col gap-1.5"
      >
        <label htmlFor="q-catalogo" class="text-[15px] font-semibold">
          Busca por nombre o síntoma
        </label>
        <div class="flex h-13.5 overflow-hidden rounded-[14px] border-2 border-texto-2 bg-blanco focus-within:border-azul">
          <input
            id="q-catalogo"
            type="search"
            value={estado.q}
            onInput={(e) => cambiar({ q: e.currentTarget.value })}
            placeholder="Ej.: ibuprofeno, suero, gripa"
            autoComplete="off"
            aria-controls="resultados"
            class="min-w-0 flex-1 border-0 bg-transparent px-4 text-base text-tinta outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            class="flex w-14 shrink-0 cursor-pointer items-center justify-center border-0 border-l border-borde bg-azul-claro text-azul"
          >
            <Icono nombre="lupa" tamano={22} grosor={2.2} />
          </button>
        </div>
      </form>

      <div class="flex flex-wrap items-end justify-between gap-3">
        <button
          ref={botonFiltros}
          type="button"
          aria-expanded={filtrosAbiertos}
          aria-controls="panel-filtros"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && filtrosAbiertos) cerrarFiltros(true);
          }}
          class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-boton border-2 border-azul bg-blanco px-4 text-[15px] font-semibold text-azul lg:hidden"
        >
          <Icono nombre="menu" tamano={18} />
          {totalFiltros ? `Filtros (${totalFiltros})` : 'Filtros'}
        </button>
        <div class="ml-auto flex items-center gap-2">
          <label htmlFor="orden" class="text-sm text-texto-2">
            Ordenar por
          </label>
          <select
            id="orden"
            value={estado.orden}
            onChange={(e) => cambiar({ orden: e.currentTarget.value as Orden }, true)}
            class="min-h-11 cursor-pointer rounded-boton border-2 border-texto-2 bg-blanco px-3 text-[15px] text-tinta"
          >
            {Object.entries(ORDENES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div class="relative flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* En celular se superpone a los resultados; en escritorio es la columna lateral. */}
        {/* eslint-disable-next-line jsx-a11y-x/no-static-element-interactions -- Esc cierra el panel abierto */}
        <div
          ref={panelFiltros}
          id="panel-filtros"
          onKeyDown={(e) => {
            if (e.key === 'Escape' && filtrosAbiertos) cerrarFiltros(true);
          }}
          class={`${filtrosAbiertos ? 'flex' : 'hidden'} absolute inset-x-0 top-0 z-30 max-h-[75dvh] flex-col gap-5 overflow-y-auto rounded-panel border border-borde bg-blanco p-5 shadow-flotante lg:sticky lg:top-6 lg:flex lg:max-h-none lg:w-65 lg:shrink-0 lg:overflow-visible lg:shadow-none`}
        >
          <fieldset class="m-0 border-0 p-0">
            <legend class="mb-2 p-0 text-base font-semibold">Categoría</legend>
            <label class="flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px]">
              <input
                type="radio"
                name="categoria"
                checked={!estado.categoria}
                onChange={() => cambiar({ categoria: undefined }, true)}
                class="size-4.5 accent-azul"
              />
              <span aria-hidden="true" class={`size-2.5 rounded-full ${PUNTO_CATEGORIA.todo}`} />
              <span class="flex-1">Todas</span>
              <span class="text-sm text-texto-2">{base.length}</span>
            </label>
            {CATEGORIAS.map((c) => (
              <label key={c.id} class="flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px]">
                <input
                  type="radio"
                  name="categoria"
                  checked={estado.categoria === c.id}
                  onChange={() => cambiar({ categoria: c.id }, true)}
                  class="size-4.5 accent-azul"
                />
                <span aria-hidden="true" class={`size-2.5 rounded-full ${PUNTO_CATEGORIA[c.id]}`} />
                <span class="flex-1">{c.nombre}</span>
                <span class="text-sm text-texto-2">{conteo[c.id]}</span>
              </label>
            ))}
          </fieldset>
          <fieldset class="m-0 border-0 p-0">
            <legend class="mb-2 p-0 text-base font-semibold">Tipo de producto</legend>
            {([undefined, ...(Object.keys(TIPOS) as Tipo[])] as const).map((t) => (
              <label key={t ?? 'todos'} class="flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px]">
                <input
                  type="radio"
                  name="tipo"
                  checked={estado.tipo === t}
                  onChange={() => cambiar({ tipo: t }, true)}
                  class="size-4.5 accent-azul"
                />
                {t ? TIPOS[t] : 'Todos'}
              </label>
            ))}
          </fieldset>
          <label class="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-medium">
            <input
              type="checkbox"
              checked={estado.descuento}
              onChange={(e) => cambiar({ descuento: e.currentTarget.checked }, true)}
              class="size-4.5 accent-azul"
            />
            Solo productos con descuento
          </label>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => cambiar({ ...INICIAL, orden: estado.orden }, true)}
              class="min-h-11 cursor-pointer self-start rounded-boton border-0 bg-transparent px-0 text-[15px] font-semibold text-azul underline"
            >
              Borrar filtros
            </button>
          )}
          <button
            type="button"
            onClick={() => cerrarFiltros(true)}
            class="min-h-12 cursor-pointer rounded-boton border-0 bg-azul px-5 text-[15px] font-semibold text-blanco lg:hidden"
          >
            {lista.length === 1 ? 'Ver 1 producto' : `Ver ${lista.length} productos`}
          </button>
        </div>

        <div id="resultados" class="flex min-w-0 flex-1 flex-col gap-6">
          {!lista.length && (
            <div class="flex flex-col gap-2.5 rounded-tarjeta border border-dashed border-texto-2 p-5">
              <p class="m-0 text-[17px] font-semibold">No hay productos con esos filtros</p>
              <p class="m-0 text-[15px] text-texto-cuerpo">Cambia la búsqueda o pregúntanos si lo conseguimos.</p>
              <div class="flex flex-wrap gap-2.5">
                <a
                  href={enlaceWhatsApp(whatsapp, estado.q.trim() ? mensajeBusqueda(estado.q) : MENSAJE_GENERAL)}
                  class="inline-flex min-h-11.5 items-center rounded-boton bg-azul px-4.5 text-[15px] font-semibold text-blanco no-underline"
                >
                  Preguntar por WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => cambiar({ ...INICIAL, orden: estado.orden }, true)}
                  class="min-h-11.5 cursor-pointer rounded-boton border-2 border-azul bg-blanco px-4.5 text-[15px] font-semibold text-azul"
                >
                  Borrar filtros
                </button>
              </div>
            </div>
          )}
          <ul class="m-0 grid list-none grid-cols-2 gap-3.5 p-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((p) => (
              <li key={p.id} class="flex min-w-0" data-vt-tarjeta style={`--vt-tarjeta: tarjeta-${p.id}`}>
                <TarjetaProducto
                  producto={p}
                  whatsapp={whatsapp}
                  nivel={2}
                  onVer={(producto, origen) => setVista({ producto, origen })}
                  sinTransicion={mostrando === p.id}
                  elegida={vista?.producto.id === p.id}
                  onPrecargar={(producto) => precargarFicha(producto.slug)}
                />
              </li>
            ))}
          </ul>
          {paginas > 1 && (
            <nav aria-label="Páginas del catálogo">
              <ul class="m-0 flex list-none flex-wrap items-center justify-center gap-1.5 p-0">
                <li>
                  <button
                    type="button"
                    disabled={pagina === 1}
                    onClick={() => irAPagina(pagina - 1)}
                    aria-label="Página anterior"
                    class="flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-azul bg-blanco text-azul disabled:cursor-default disabled:border-borde-control disabled:text-texto-2"
                  >
                    <Icono nombre="anterior" tamano={18} grosor={2.4} />
                  </button>
                </li>
                {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      onClick={() => irAPagina(n)}
                      aria-label={`Página ${n}`}
                      aria-current={n === pagina ? 'page' : undefined}
                      class={`flex size-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold ${
                        n === pagina ? 'border-0 bg-azul text-blanco' : 'border border-borde-control bg-blanco text-tinta'
                      }`}
                    >
                      {n}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    disabled={pagina === paginas}
                    onClick={() => irAPagina(pagina + 1)}
                    aria-label="Página siguiente"
                    class="flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-azul bg-blanco text-azul disabled:cursor-default disabled:border-borde-control disabled:text-texto-2"
                  >
                    <Icono nombre="siguiente" tamano={18} grosor={2.4} />
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      <DialogoFicha abierto={vista} whatsapp={whatsapp} entrega={entrega} onCerrar={cerrarVista} onMostrar={setMostrando} />
    </div>
  );
}
