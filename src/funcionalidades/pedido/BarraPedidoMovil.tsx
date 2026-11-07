import { useEffect, useRef, useState } from 'preact/hooks';
import { contarUnidades, resolverLineas, subtotal } from '@/dominio/carrito';
import { formatearPrecio } from '@/dominio/formato';
import type { Tienda } from '@/dominio/sitio';
import { usarCatalogo } from '@/compartido/catalogoCliente';
import HojaInferior from '@/compartido/ui/HojaInferior';
import ProgresoDomicilio from './ProgresoDomicilio';
import { usarCarrito } from './usarCarrito';
import VistaPedido from './VistaPedido';

/**
 * Barra inferior del pedido, debajo de 1200 px: abre la hoja con la vista previa. Solo aparece con
 * productos y reserva su altura al final de la página (--alto-barra-pedido, en global.css) para no tapar nada.
 */
export default function BarraPedidoMovil({ tienda }: { tienda: Tienda }) {
  const carrito = usarCarrito();
  const catalogo = usarCatalogo();
  const lineas = catalogo ? resolverLineas(carrito, catalogo) : [];
  const total = subtotal(lineas);
  const unidades = catalogo ? contarUnidades(lineas) : contarUnidades(carrito);
  const resumen = [unidades === 1 ? '1 producto' : `${unidades} productos`, ...(catalogo ? [formatearPrecio(total)] : [])].join(' · ');
  const barra = useRef<HTMLDivElement>(null);
  const [abierta, setAbierta] = useState(false);
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

  return (
    <>
      {hayProductos && (
        <div ref={barra} class="fixed inset-x-0 bottom-0 z-20 border-t border-celadon bg-blanco pb-[env(safe-area-inset-bottom)] shadow-barra lg:hidden">
          <ProgresoDomicilio total={total} umbral={tienda.umbral} variante="barra" />
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setAbierta(true)}
            class="flex min-h-15 w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-4 py-2 text-left text-ink"
          >
            <span data-contador-pedido class="inline-block text-[15.5px] font-semibold">
              {resumen}
            </span>
            <span class="inline-flex min-h-11 shrink-0 items-center rounded-boton bg-bottle px-4.5 text-[15px] font-semibold text-blanco">Ver pedido</span>
          </button>
        </div>
      )}
      <HojaInferior abierta={abierta} titulo="Tu pedido" etiquetaCerrar="Cerrar el pedido" onCerrar={() => setAbierta(false)}>
        <VistaPedido
          umbral={tienda.umbral}
          onVaciado={() => {
            // La barra desaparece con el pedido: el foco pasa al contenido.
            setAbierta(false);
            document.getElementById('contenido')?.focus();
          }}
        />
      </HojaInferior>
    </>
  );
}
