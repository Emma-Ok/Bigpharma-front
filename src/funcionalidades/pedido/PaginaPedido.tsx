import { useEffect, useRef, useState } from 'preact/hooks';
import { contarUnidades, resolverLineas, subtotal } from '@/dominio/carrito';
import type { ProductoResumen } from '@/dominio/producto';
import type { Tienda } from '@/dominio/sitio';
import { usarCatalogo } from '@/compartido/catalogoCliente';
import Boton from '@/compartido/ui/Boton';
import FormularioPedido from './FormularioPedido';
import ResumenPedido from './ResumenPedido';
import { usarCarrito } from './usarCarrito';

interface Props {
  productos: ProductoResumen[];
  tienda: Tienda;
}

/** Página del pedido: resumen editable y formulario, o el aviso de pedido vacío. */
export default function PaginaPedido({ productos, tienda }: Props) {
  const carrito = usarCarrito();
  const catalogo = usarCatalogo(productos) ?? productos;
  const lineas = resolverLineas(carrito, catalogo);
  const vacio = useRef<HTMLParagraphElement>(null);
  const [recienVaciado, setRecienVaciado] = useState(false);
  // Después de vaciar, la lista desaparece: el foco pasa al aviso de pedido vacío.
  useEffect(() => {
    if (recienVaciado && !lineas.length) vacio.current?.focus();
  }, [recienVaciado, lineas.length]);

  if (!lineas.length) {
    return (
      <div class="flex flex-col items-start gap-4 rounded-panel border border-dashed border-muted p-6">
        <p ref={vacio} tabIndex={-1} class="m-0 text-lg font-semibold focus:outline-none">
          Tu pedido está vacío
        </p>
        <p class="m-0 text-muted">Agrega productos desde el catálogo y vuelve aquí para enviarlo por WhatsApp.</p>
        <Boton href="/catalogo">Ver catálogo</Boton>
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-8 lg:flex-row lg:items-start">
      <ResumenPedido
        lineas={lineas}
        total={subtotal(lineas)}
        unidades={contarUnidades(lineas)}
        umbral={tienda.umbral}
        onVaciado={() => setRecienVaciado(true)}
      />
      <FormularioPedido lineas={lineas} whatsapp={tienda.whatsapp} />
    </div>
  );
}
