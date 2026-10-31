import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { urlProducto, type Producto, type ProductoResumen } from '../lib/catalogo';
import FichaProducto from './FichaProducto';
import Icono from './Icono';
import { abrirConTransicion } from './movimiento';

interface Props {
  /** Producto elegido y el elemento que abrió el diálogo (para devolverle el foco). */
  abierto: { producto: ProductoResumen; origen: HTMLElement } | null;
  whatsapp: string;
  entrega: string;
  onCerrar: () => void;
  /** Se llama dentro de la View Transition: la tarjeta cede su nombre de transición a la ficha. */
  onMostrar?: (id: string) => void;
}

const fichas = new Map<string, Promise<Producto>>();

/** Pide la ficha antes del clic (al pasar el puntero o enfocar), para abrirla sin espera. */
export function precargarFicha(slug: string) {
  cargarFicha(slug).catch(() => fichas.delete(slug));
}

function cargarFicha(slug: string): Promise<Producto> {
  if (!fichas.has(slug)) {
    fichas.set(
      slug,
      fetch(`/producto/${slug}.json`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Producto>;
      }),
    );
  }
  return fichas.get(slug)!;
}

/** Vista rápida de la ficha sobre el catálogo: <dialog> modal, Esc cierra y el foco vuelve a la tarjeta. */
export default function DialogoFicha({ abierto, whatsapp, entrega, onCerrar, onMostrar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const [ficha, setFicha] = useState<Producto | null>(null);

  // Se abre justo después de pintar la ficha (dentro de la View Transition) y el foco va a «Cerrar».
  useLayoutEffect(() => {
    const d = dialogo.current;
    if (ficha && d && !d.open) {
      d.showModal();
      cerrar.current?.focus();
    }
  }, [ficha]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (!abierto) {
      if (d.open) d.close();
      return;
    }
    let vigente = true;
    cargarFicha(abierto.producto.slug)
      .then((p) => {
        if (!vigente) return;
        abrirConTransicion(() => {
          onMostrar?.(p.id);
          setFicha(p);
        });
      })
      .catch(() => {
        // Sin la ficha en JSON, se navega a la página del producto.
        if (vigente) window.location.href = urlProducto(abierto.producto);
      });
    return () => {
      vigente = false;
    };
  }, [abierto]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    const alCerrar = () => {
      const origen = abierto?.origen;
      setFicha(null);
      onCerrar();
      origen?.focus();
    };
    d.addEventListener('close', alCerrar);
    return () => d.removeEventListener('close', alCerrar);
  }, [abierto, onCerrar]);

  return (
    // Clic en el fondo cierra; con teclado cierra Esc (nativo del <dialog>).
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={dialogo}
      aria-modal="true"
      aria-labelledby="ficha-rapida-titulo"
      class="dialogo-ficha m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-24px)] max-w-245 overflow-y-auto rounded-panel border-0 bg-blanco p-[clamp(18px,3vw,36px)] text-tinta shadow-flotante backdrop:bg-tinta/45"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      {ficha && (
        <div class="relative">
          <button
            type="button"
            aria-label="Cerrar detalles del producto"
            ref={cerrar}
            onClick={() => dialogo.current?.close()}
            class="absolute top-0 right-0 z-10 flex size-11.5 cursor-pointer items-center justify-center rounded-boton border-2 border-tinta bg-blanco text-tinta"
          >
            <Icono nombre="cerrar" grosor={2.4} />
          </button>
          <FichaProducto producto={ficha} whatsapp={whatsapp} entrega={entrega} nivel={2} idTitulo="ficha-rapida-titulo" />
          <p class="mt-6 mb-0">
            <a href={urlProducto(ficha)} class="inline-flex min-h-11 items-center gap-2 font-semibold text-azul">
              Ver la página completa del producto
              <Icono nombre="flecha" tamano={18} />
            </a>
          </p>
        </div>
      )}
    </dialog>
  );
}
