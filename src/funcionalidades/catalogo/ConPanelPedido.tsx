import type { ComponentChildren } from 'preact';
import type { ProductoResumen } from '@/dominio/producto';
import PanelPedido from '@/funcionalidades/pedido/PanelPedido';

export const GRILLA = 'm-0 grid list-none grid-cols-2 gap-3.5 p-0 sm:grid-cols-3';

interface Props {
  umbral: number;
  productos: ProductoResumen[];
  children: ComponentChildren;
}

/** Productos y, desde 1200 px, el panel «Tu pedido» sticky a la derecha. Por debajo está la barra inferior. */
export default function ConPanelPedido({ umbral, productos, children }: Props) {
  return (
    <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      <div class="flex min-w-0 flex-col gap-4">{children}</div>
      <div class="hidden lg:sticky lg:top-6 lg:block">
        <PanelPedido umbral={umbral} productos={productos} />
      </div>
    </div>
  );
}
