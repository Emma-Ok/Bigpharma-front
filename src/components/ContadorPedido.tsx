import { contarUnidades } from '../lib/carrito';
import Icono from './Icono';
import { usarCarrito } from './usarCarrito';

/** Enlace a /pedido con el número de unidades. Es el destino del punto que viaja al agregar. */
export default function ContadorPedido(_: { variante: 'encabezado' }) {
  const unidades = contarUnidades(usarCarrito());
  const texto = unidades === 1 ? '1 producto' : `${unidades} productos`;
  return (
    <a
      href="/pedido"
      class="relative ml-1 inline-flex size-11 items-center justify-center rounded-boton border border-texto-2 text-tinta"
      aria-label={`Tu pedido: ${texto}`}
    >
      <Icono nombre="bolsa" />
      <span
        data-contador-pedido
        aria-hidden="true"
        class={`absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-azul px-1 text-xs font-bold text-blanco ${unidades ? '' : 'invisible'}`}
      >
        {unidades}
      </span>
    </a>
  );
}
