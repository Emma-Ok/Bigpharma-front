import { useEffect, useRef, useState } from 'preact/hooks';
import { buscar, filtrar, terminosDeBusqueda } from '@/dominio/busqueda';
import { CATEGORIAS } from '@/dominio/categorias';
import type { ProductoResumen } from '@/dominio/producto';
import { enlaceWhatsApp, mensajeBusqueda } from '@/dominio/whatsapp';
import Icono from './Icono';
import TarjetaProducto from './TarjetaProducto';
import { PUNTO_CATEGORIA } from './estilosCategoria';
import { cargarCatalogo } from './usarCarrito';

const LO_MAS_BUSCADO = ['dolor de cabeza', 'suero', 'protector solar', 'gripa'];

function usarPorPagina(): { porPagina: number; columnas: string } {
  const consulta = () => {
    if (typeof window === 'undefined') return { porPagina: 4, columnas: 'grid-cols-2' };
    if (window.matchMedia('(min-width: 75rem)').matches) return { porPagina: 5, columnas: 'grid-cols-5' };
    if (window.matchMedia('(min-width: 37.5rem)').matches) return { porPagina: 3, columnas: 'grid-cols-3' };
    return { porPagina: 4, columnas: 'grid-cols-2' };
  };
  const [valor, setValor] = useState(consulta);
  useEffect(() => {
    const alCambiar = () => setValor(consulta());
    window.addEventListener('resize', alCambiar);
    return () => window.removeEventListener('resize', alCambiar);
  }, []);
  return valor;
}

/**
 * Diálogo de búsqueda. Lo abre cualquier elemento con [data-abrir-buscador]
 * (lupa del encabezado, campo de la portada). Esc cierra y el foco vuelve al que lo abrió.
 */
export default function Buscador({ whatsapp }: { whatsapp: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const origen = useRef<HTMLElement | null>(null);
  const [productos, setProductos] = useState<ProductoResumen[]>([]);
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(0);
  const { porPagina, columnas } = usarPorPagina();

  useEffect(() => {
    const abrir = (e: MouseEvent) => {
      const disparador = (e.target as HTMLElement).closest<HTMLElement>('[data-abrir-buscador]');
      const d = dialogo.current;
      if (!disparador || !d || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      origen.current = disparador;
      cargarCatalogo().then(setProductos);
      setPagina(0);
      if (!d.open) d.showModal();
      campo.current?.focus();
    };
    document.addEventListener('click', abrir);
    return () => document.removeEventListener('click', abrir);
  }, []);

  useEffect(() => {
    const d = dialogo.current;
    const alCerrar = () => origen.current?.focus();
    d?.addEventListener('close', alCerrar);
    return () => d?.removeEventListener('close', alCerrar);
  }, []);

  const hayConsulta = terminosDeBusqueda(q).length > 0;
  const fuente = hayConsulta ? buscar(productos, q) : filtrar(productos, {}).slice(0, 10);
  const paginas = Math.max(1, Math.ceil(fuente.length / porPagina));
  const actual = Math.min(pagina, paginas - 1);
  const items = fuente.slice(actual * porPagina, actual * porPagina + porPagina);
  const titulo = hayConsulta
    ? fuente.length
      ? `Resultados para «${q.trim()}» (${fuente.length})`
      : `No encontramos «${q.trim()}»`
    : 'Productos destacados';
  const cerrar = () => dialogo.current?.close();

  return (
    // Clic en el fondo cierra; con teclado cierra Esc.
    // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={dialogo}
      aria-modal="true"
      aria-labelledby="buscador-titulo"
      class="buscador mx-auto mt-[clamp(8px,6vh,64px)] mb-auto max-h-[calc(100dvh-24px)] w-[calc(100%-16px)] max-w-295 overflow-y-auto rounded-panel border-0 bg-transparent p-0 text-ink backdrop:bg-ink/45"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      onKeyDown={(e) => {
        // En un campo de búsqueda, Esc solo borra el texto: aquí además cierra el diálogo.
        if (e.key === 'Escape') {
          e.preventDefault();
          e.currentTarget.close();
        }
      }}
    >
      <h2 id="buscador-titulo" class="visualmente-oculto">
        Buscar productos
      </h2>
      <div class="flex items-center gap-2.5">
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          class="flex h-14.5 min-w-0 flex-1 overflow-hidden rounded-[14px] border-2 border-bottle bg-blanco"
        >
          <label htmlFor="q-buscar" class="visualmente-oculto">
            Busca por nombre o síntoma
          </label>
          <input
            ref={campo}
            id="q-buscar"
            type="search"
            value={q}
            onInput={(e) => {
              setQ(e.currentTarget.value);
              setPagina(0);
            }}
            placeholder="Busca por nombre o síntoma"
            autoComplete="off"
            aria-controls="resultados-busqueda"
            class="min-w-0 flex-1 border-0 bg-transparent px-4 text-[16.5px] text-ink outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            class="flex w-14 shrink-0 cursor-pointer items-center justify-center border-0 border-l border-celadon bg-celadon text-bottle"
          >
            <Icono nombre="lupa" tamano={22} grosor={2.2} />
          </button>
        </form>
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar búsqueda"
          class="flex size-13 shrink-0 cursor-pointer items-center justify-center rounded-boton border-2 border-ink bg-blanco text-ink"
        >
          <Icono nombre="cerrar" grosor={2.4} />
        </button>
      </div>

      <div class="buscador-panel mt-2.5 flex flex-row-reverse flex-wrap gap-x-9 gap-y-6 rounded-[18px] border border-celadon bg-blanco p-[clamp(16px,2vw,24px)] shadow-flotante">
        <div id="resultados-busqueda" class="flex min-w-0 flex-[3_1_480px] flex-col gap-3.5">
          <div class="flex items-center justify-between gap-3">
            <p aria-live="polite" class="m-0 text-[17px] font-semibold">
              {titulo}
            </p>
            {paginas > 1 && (
              <div class="flex gap-2">
                <button
                  type="button"
                  disabled={actual === 0}
                  onClick={() => setPagina(actual - 1)}
                  aria-label="Productos anteriores"
                  class="flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-bottle bg-blanco text-bottle disabled:cursor-default disabled:border-muted/40 disabled:text-muted"
                >
                  <Icono nombre="flecha-atras" tamano={18} grosor={2.4} />
                </button>
                <button
                  type="button"
                  disabled={actual >= paginas - 1}
                  onClick={() => setPagina(actual + 1)}
                  aria-label="Productos siguientes"
                  class="flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-bottle bg-blanco text-bottle disabled:cursor-default disabled:border-muted/40 disabled:text-muted"
                >
                  <Icono nombre="flecha" tamano={18} grosor={2.4} />
                </button>
              </div>
            )}
          </div>
          {hayConsulta && !fuente.length && (
            <div class="flex flex-col gap-2.5 rounded-[14px] border border-dashed border-muted p-4.5">
              <p class="m-0 text-[15.5px] text-muted">Revisa cómo lo escribiste o pregúntanos si lo conseguimos.</p>
              <a
                href={enlaceWhatsApp(whatsapp, mensajeBusqueda(q))}
                class="inline-flex min-h-11.5 items-center self-start rounded-boton bg-bottle px-4.5 text-[15.5px] font-semibold text-blanco no-underline"
              >
                Preguntar por WhatsApp
              </a>
            </div>
          )}
          <ul key={`${q}-${actual}`} class={`resultados m-0 grid list-none gap-3 p-0 ${columnas}`}>
            {items.map((p) => (
              <li key={p.id} class="flex min-w-0">
                <TarjetaProducto producto={p} whatsapp={whatsapp} sinTransicion />
              </li>
            ))}
          </ul>
          <a
            href={hayConsulta ? `/catalogo?q=${encodeURIComponent(q.trim())}` : '/catalogo'}
            class="inline-flex min-h-11 items-center self-start text-[15.5px] font-semibold text-bottle"
          >
            {hayConsulta ? 'Ver todos los resultados en el catálogo' : 'Ver todo el catálogo'}
          </a>
        </div>
        <div class="flex min-w-0 flex-[1_1_220px] flex-col gap-5.5">
          <nav aria-labelledby="buscador-categorias">
            <h3 id="buscador-categorias" class="m-0 mb-1.5 text-base font-semibold">
              Categorías
            </h3>
            <ul class="m-0 list-none p-0">
              {CATEGORIAS.map((c) => (
                <li key={c.id}>
                  <a
                    href={`/catalogo?categoria=${c.id}`}
                    class="flex min-h-11 items-center gap-2.5 text-[15.5px] text-ink no-underline hover:underline"
                  >
                    <span aria-hidden="true" class={`size-2.5 shrink-0 rounded-full ${PUNTO_CATEGORIA[c.id]}`} />
                    {c.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h3 class="m-0 mb-2.5 text-base font-semibold">Lo más buscado</h3>
            <div class="flex flex-wrap gap-2">
              {LO_MAS_BUSCADO.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setQ(t);
                    setPagina(0);
                    campo.current?.focus();
                  }}
                  class="min-h-11 cursor-pointer rounded-full border border-muted bg-blanco px-3.5 text-[14.5px] text-ink"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
