import { useEffect, useRef } from 'preact/hooks';
import { contarUnidades, resolverLineas, subtotal } from '@/dominio/carrito';
import { formatearPrecio } from '@/dominio/formato';
import { textoDomicilio } from '@/dominio/domicilio';
import ProgresoDomicilio from './ProgresoDomicilio';
import { usarCatalogo } from '@/compartido/catalogoCliente';
import { usarCarrito } from './usarCarrito';

/**
 * Barra inferior del pedido, debajo de 1200 px. Solo aparece con productos y reserva su altura al final
 * de la página (--alto-barra-pedido, en global.css) para no tapar nada.
 */
export default function BarraPedidoMovil({ umbral }: { umbral: number }) {
  const carrito = usarCarrito();
  const catalogo = usarCatalogo();
  const lineas = catalogo ? resolverLineas(carrito, catalogo) : [];
  const total = subtotal(lineas);
  const unidades = catalogo ? contarUnidades(lineas) : contarUnidades(carrito);
  const resumen = `${unidades === 1 ? '1 producto' : `${unidades} productos`}${catalogo ? `, ${formatearPrecio(total)}` : ''}`;
  const barra = useRef<HTMLDivElement>(null);
  const hayProductos = unidades > 0;

  useEffect(() => {
    const el = barra.current;
    if (!hayProductos || !el) return;
    const raiz = document.documentElement;
    const observador = new ResizeObserver(() => raiz.style.setProperty('--alto-barra-pedido', `${el.offsetHeight}px`));
    observador.observe(el);
    return () => {
      observador.disconnect();
      raiz.style.removeProperty('--alto-barra-pedido');
    };
  }, [hayProductos]);

  if (!hayProductos) return null;

  return (
    <div ref={barra} class="fixed inset-x-0 bottom-0 z-20 flex flex-col border-t border-celadon bg-blanco shadow-barra lg:hidden">
      <ProgresoDomicilio total={total} umbral={umbral} variante="barra" />
      <div class="flex items-center gap-3 px-4 pt-2.5 pb-4">
        <p aria-live="polite" class="m-0 flex min-w-0 flex-1 flex-col gap-px">
          <span class="text-[15.5px] font-semibold">
            <span data-contador-pedido class="inline-block">
              {resumen}
            </span>
          </span>
          <span class="text-[13.5px] leading-snug text-muted">{textoDomicilio(total, unidades, umbral)}</span>
        </p>
        <a
          href="/pedido"
          class="inline-flex min-h-12 shrink-0 items-center rounded-boton bg-bottle px-4.5 text-[15.5px] font-semibold text-blanco no-underline"
        >
          Ver pedido
        </a>
      </div>
    </div>
  );
}
