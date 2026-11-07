import { useRef } from 'preact/hooks';
import { contarUnidades, resolverLineas, subtotal } from '@/dominio/carrito';
import type { ProductoResumen } from '@/dominio/producto';
import { formatearPrecio } from '@/dominio/formato';
import { cambiarCantidad } from './acciones';
import { textoDomicilio } from '@/dominio/domicilio';
import ProgresoDomicilio from './ProgresoDomicilio';
import VaciarPedido from './VaciarPedido';
import { usarCarrito, usarCatalogo } from './usarCarrito';

interface Props {
  umbral: number;
  productos?: ProductoResumen[];
}

/** Panel lateral del pedido en escritorio. */
export default function PanelPedido({ umbral, productos }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const carrito = usarCarrito();
  const catalogo = usarCatalogo(productos);
  const lineas = catalogo ? resolverLineas(carrito, catalogo) : [];
  const total = subtotal(lineas);
  const unidades = contarUnidades(lineas);

  return (
    <aside
      aria-labelledby="pedido-titulo"
      class="sticky top-6 flex min-w-0 flex-col gap-3.5 rounded-panel border border-celadon bg-blanco p-5.5"
    >
      <h3 id="pedido-titulo" ref={titulo} tabIndex={-1} class="m-0 focus:outline-none text-[21px] leading-tight font-semibold">
        Tu pedido
      </h3>
      <div class="flex flex-col gap-3">
        {lineas.length === 0 ? (
          <p class="m-0 text-[14.5px] leading-normal text-muted">Aún no tienes productos. Usa Agregar en el catálogo.</p>
        ) : (
          <>
            <ul class="m-0 list-none p-0">
              {lineas.map((l) => (
                <li key={l.producto.id} class="flex items-start justify-between gap-2.5 border-b border-celadon/60 py-2.5">
                  <span class="flex min-w-0 flex-col gap-0.5">
                    <span class="text-[14.5px] leading-tight font-semibold">{l.producto.nombre}</span>
                    <span class="text-[13.5px] text-muted">
                      {l.cantidad} {l.cantidad === 1 ? 'unidad' : 'unidades'} de {formatearPrecio(l.producto.precio)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Quitar del pedido: ${l.producto.nombre}`}
                      onClick={() => {
                        cambiarCantidad(l.producto, 0);
                        // El botón desaparece: el foco pasa al título del panel.
                        titulo.current?.focus();
                      }}
                      class="min-h-8 cursor-pointer self-start border-0 bg-transparent p-0 text-[13.5px] font-semibold text-ink underline"
                    >
                      Quitar
                    </button>
                  </span>
                  <span class="shrink-0 text-[15px] font-semibold">{formatearPrecio(l.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p aria-live="polite" class="m-0 flex justify-between gap-3">
              <span class="font-semibold">Subtotal</span>
              <span class="text-lg font-bold">{formatearPrecio(total)}</span>
            </p>
            <VaciarPedido onVaciado={() => titulo.current?.focus()} />
          </>
        )}
        <div class="flex flex-col gap-2 rounded-boton bg-celadon p-3">
          <p aria-live="polite" class="m-0 text-[14.5px] leading-snug font-semibold">{textoDomicilio(total, unidades, umbral)}</p>
          <ProgresoDomicilio total={total} umbral={umbral} variante="panel" />
        </div>
      </div>
      {lineas.length > 0 && (
        <a
          href="/pedido"
          class="flex min-h-13 items-center justify-center rounded-boton bg-bottle font-semibold text-blanco no-underline"
        >
          Continuar con el pedido
        </a>
      )}
      <p class="m-0 text-[13.5px] leading-normal text-muted">El total final se confirma por WhatsApp antes de cobrar.</p>
    </aside>
  );
}
