import { useRef } from 'preact/hooks';
import type { ProductoResumen } from '@/dominio/producto';
import VistaPedido from './VistaPedido';

interface Props {
  umbral: number;
  productos?: ProductoResumen[];
}

/** Panel lateral del pedido, desde 1200 px. */
export default function PanelPedido({ umbral, productos }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);
  return (
    <aside aria-labelledby="pedido-titulo" class="flex min-w-0 flex-col gap-3.5 rounded-panel border border-celadon bg-blanco p-5.5">
      <h3 id="pedido-titulo" ref={titulo} tabIndex={-1} class="m-0 text-[21px] leading-tight font-semibold focus:outline-none">
        Tu pedido
      </h3>
      <VistaPedido umbral={umbral} productos={productos} onVaciado={() => titulo.current?.focus()} />
    </aside>
  );
}
