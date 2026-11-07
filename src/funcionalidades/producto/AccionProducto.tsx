import Boton from '@/compartido/ui/Boton';
import type { ProductoResumen } from '@/dominio/producto';
import { enlaceWhatsApp, mensajeDisponibilidad, mensajeFormula } from '@/dominio/whatsapp';
import ControlCantidad from '@/funcionalidades/pedido/ControlCantidad';

interface Props {
  producto: Pick<ProductoResumen, 'id' | 'nombre' | 'condicionVenta' | 'disponibilidad'>;
  whatsapp: string;
  tamano: 'tarjeta' | 'ficha';
}

/** La acción principal de un producto: enviar la fórmula, preguntar disponibilidad o agregarlo al pedido. */
export default function AccionProducto({ producto: p, whatsapp, tamano }: Props) {
  const ficha = tamano === 'ficha';
  const medida = ficha ? 'grande' : 'compacto';
  if (p.condicionVenta === 'formula') {
    return (
      <Boton
        variante="formula"
        tamano={medida}
        class="w-full"
        href={enlaceWhatsApp(whatsapp, mensajeFormula(p.nombre))}
        aria-label={ficha ? undefined : `Enviar mi fórmula: ${p.nombre}`}
      >
        {ficha ? 'Enviar fórmula por WhatsApp' : 'Enviar mi fórmula'}
      </Boton>
    );
  }
  if (p.disponibilidad === 'agotado') {
    return (
      <Boton
        variante="secundario"
        tamano={medida}
        class="w-full"
        href={enlaceWhatsApp(whatsapp, mensajeDisponibilidad(p.nombre))}
        aria-label={ficha ? undefined : `Preguntar disponibilidad por WhatsApp: ${p.nombre}`}
      >
        {ficha ? 'Preguntar disponibilidad por WhatsApp' : 'Preguntar disponibilidad'}
      </Boton>
    );
  }
  return <ControlCantidad producto={p} tamano={tamano} />;
}
