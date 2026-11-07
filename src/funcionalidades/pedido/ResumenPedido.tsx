import { useRef } from 'preact/hooks';
import type { LineaResuelta } from '@/dominio/carrito';
import { progresoDomicilio } from '@/dominio/domicilio';
import { formatearPrecio } from '@/dominio/formato';
import Icono from '@/compartido/ui/Icono';
import { cambiarCantidad } from './acciones';
import ProgresoDomicilio from './ProgresoDomicilio';
import VaciarPedido from './VaciarPedido';

interface Props {
  lineas: LineaResuelta[];
  total: number;
  unidades: number;
  umbral: number;
  onVaciado: () => void;
}

/** Lista editable del pedido, subtotal y avance al domicilio gratis. */
export default function ResumenPedido({ lineas, total, unidades, umbral, onVaciado }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const { falta, gratis } = progresoDomicilio(total, umbral);
  const cantidad = 'flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent text-2xl font-semibold text-bottle';

  return (
    <section aria-labelledby="prod-pedido" class="flex min-w-0 flex-1 flex-col gap-4">
      <h2 id="prod-pedido" ref={titulo} tabIndex={-1} aria-live="polite" class="m-0 text-xl font-semibold focus:outline-none">
        {unidades === 1 ? '1 producto' : `${unidades} productos`}
      </h2>
      <ul class="m-0 flex list-none flex-col p-0">
        {lineas.map((l) => (
          <li key={l.producto.id} class="flex items-center justify-between gap-3 border-b border-celadon/60 py-3.5">
            <div class="min-w-0">
              <p class="m-0 font-semibold">{l.producto.nombre}</p>
              <p class="m-0 text-sm text-muted">
                {l.producto.presentacion}, {formatearPrecio(l.producto.precio)} c/u
              </p>
              <p class="m-0 mt-0.5 font-bold">{formatearPrecio(l.subtotal)}</p>
            </div>
            <div
              role="group"
              aria-label={`Cantidad de ${l.producto.nombre}`}
              class="flex shrink-0 items-center rounded-boton border-2 border-bottle bg-celadon text-bottle"
            >
              <button
                type="button"
                aria-label={`Quitar una unidad: ${l.producto.nombre}`}
                onClick={() => {
                  cambiarCantidad(l.producto, l.cantidad - 1);
                  // Si la línea desaparece, el foco pasa al título de la lista.
                  if (l.cantidad === 1) titulo.current?.focus();
                }}
                class={cantidad}
              >
                −
              </button>
              <span class="min-w-7 text-center font-bold text-ink">{l.cantidad}</span>
              <button
                type="button"
                aria-label={`Agregar una unidad: ${l.producto.nombre}`}
                onClick={() => cambiarCantidad(l.producto, l.cantidad + 1)}
                class={cantidad}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
      <dl aria-live="polite" class="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt class="font-semibold">Subtotal</dt>
        <dd class="m-0 text-right text-lg font-bold">{formatearPrecio(total)}</dd>
        <dt class="font-semibold">Domicilio</dt>
        <dd class="m-0 text-right text-muted">{gratis ? 'Gratis' : `Te faltan ${formatearPrecio(falta)} para que sea gratis`}</dd>
      </dl>
      <ProgresoDomicilio total={total} umbral={umbral} variante="panel" />
      <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <a href="/catalogo" class="inline-flex min-h-11 items-center gap-2 font-semibold text-bottle">
          <Icono nombre="flecha-atras" tamano={18} />
          Seguir comprando
        </a>
        <VaciarPedido onVaciado={onVaciado} />
      </div>
    </section>
  );
}
