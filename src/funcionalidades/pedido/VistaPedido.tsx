import { contarUnidades, resolverLineas, subtotal } from '@/dominio/carrito';
import { textoDomicilio } from '@/dominio/domicilio';
import { formatearPrecio } from '@/dominio/formato';
import type { ProductoResumen } from '@/dominio/producto';
import { mensajePedido } from '@/dominio/whatsapp';
import { usarCatalogo } from '@/compartido/catalogoCliente';
import Boton from '@/compartido/ui/Boton';
import ProgresoDomicilio from './ProgresoDomicilio';
import { usarCarrito } from './usarCarrito';
import VaciarPedido from './VaciarPedido';

/** Los datos que el cliente llena en /pedido, donde también autoriza su tratamiento (Ley 1581). */
const POR_LLENAR = { nombre: '[tu nombre]', direccion: '[tu barrio y dirección]', pago: '[tu forma de pago]' };

interface Props {
  umbral: number;
  productos?: ProductoResumen[];
  /** Dónde poner el foco después de vaciar (el botón desaparece con el pedido). */
  onVaciado: () => void;
}

/** Vista previa del mensaje y avance al domicilio gratis: lo que muestran el panel y la hoja del pedido. */
export default function VistaPedido({ umbral, productos, onVaciado }: Props) {
  const carrito = usarCarrito();
  const catalogo = usarCatalogo(productos);
  const lineas = catalogo ? resolverLineas(carrito, catalogo) : [];
  const total = subtotal(lineas);
  const unidades = contarUnidades(lineas);

  return (
    <div class="flex flex-col gap-3.5">
      {lineas.length === 0 ? (
        <p class="m-0 text-[14.5px] leading-normal text-muted">Aún no tienes productos. Usa Agregar en el catálogo.</p>
      ) : (
        <>
          <p aria-live="polite" class="m-0 flex items-baseline justify-between gap-3">
            <span class="font-semibold">Subtotal</span>
            <span class="text-lg font-bold">{formatearPrecio(total)}</span>
          </p>
          <div class="flex flex-col gap-1.5">
            <p class="m-0 text-sm font-semibold text-muted">Así llega tu mensaje</p>
            <div
              role="region"
              aria-label="Vista previa del mensaje"
              // Tiene scroll si el pedido es largo: enfocable para recorrerlo con teclado.
              // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex
              tabIndex={0}
              class="max-h-60 overflow-y-auto rounded-boton rounded-tl-none bg-celadon p-3.5 text-[14.5px] leading-normal whitespace-pre-wrap text-ink outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
            >
              {mensajePedido(lineas, POR_LLENAR)}
            </div>
          </div>
        </>
      )}
      <div class="flex flex-col gap-2 rounded-boton border border-celadon p-3">
        <p aria-live="polite" class="m-0 text-[14.5px] leading-snug font-semibold">
          {textoDomicilio(total, unidades, umbral)}
        </p>
        <ProgresoDomicilio total={total} umbral={umbral} variante="panel" />
      </div>
      {lineas.length > 0 && (
        <>
          <Boton href="/pedido" class="w-full">
            Continuar con mis datos
          </Boton>
          <VaciarPedido onVaciado={onVaciado} />
        </>
      )}
      <p class="m-0 text-[13.5px] leading-normal text-muted">El total final se confirma por WhatsApp antes de cobrar.</p>
    </div>
  );
}
