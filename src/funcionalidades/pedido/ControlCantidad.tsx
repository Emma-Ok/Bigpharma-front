import { useEffect, useRef } from 'preact/hooks';
import { cantidadDe } from '@/dominio/carrito';
import Boton from '@/compartido/ui/Boton';
import { agregarAlPedido, cambiarCantidad } from './acciones';
import { usarCarrito } from './usarCarrito';

interface Props {
  producto: { id: string; nombre: string };
  tamano: 'tarjeta' | 'ficha';
}

/**
 * «Agregar» que pasa a − / +. Cuando un botón desaparece, el foco pasa al
 * control que lo reemplaza para no perderlo.
 */
export default function ControlCantidad({ producto, tamano }: Props) {
  const cantidad = cantidadDe(usarCarrito(), producto.id);
  const agregarRef = useRef<HTMLButtonElement>(null);
  const masRef = useRef<HTMLButtonElement>(null);
  const enfocar = useRef<'agregar' | 'mas' | null>(null);

  useEffect(() => {
    if (enfocar.current === 'mas') masRef.current?.focus();
    if (enfocar.current === 'agregar') agregarRef.current?.focus();
    enfocar.current = null;
  }, [cantidad]);

  const ficha = tamano === 'ficha';

  if (cantidad === 0) {
    return (
      <Boton
        referencia={agregarRef}
        tamano={ficha ? 'grande' : 'compacto'}
        class="w-full"
        data-agregar
        aria-label={ficha ? undefined : `Agregar al pedido: ${producto.nombre}`}
        onClick={(e) => {
          enfocar.current = 'mas';
          agregarAlPedido(producto, e.currentTarget);
        }}
      >
        {ficha ? 'Agregar al pedido' : 'Agregar'}
      </Boton>
    );
  }

  const grupo = (
    <div
      role="group"
      aria-label={`Cantidad de ${producto.nombre}`}
      class={`control-cantidad flex items-center justify-between border-2 border-bottle bg-celadon text-bottle ${
        ficha ? 'rounded-[14px]' : 'rounded-boton'
      }`}
    >
      <button
        type="button"
        aria-label={`Quitar una unidad: ${producto.nombre}`}
        onClick={() => {
          if (cantidad === 1) enfocar.current = 'agregar';
          cambiarCantidad(producto, cantidad - 1);
        }}
        class={`flex cursor-pointer items-center justify-center border-0 bg-transparent text-2xl font-semibold text-bottle ${
          ficha ? 'h-12.5 w-13' : 'h-10 w-11'
        }`}
      >
        −
      </button>
      <span class={`min-w-8 text-center font-bold text-ink ${ficha ? 'text-lg' : 'text-base'}`}>{cantidad}</span>
      <button
        ref={masRef}
        type="button"
        aria-label={`Agregar una unidad: ${producto.nombre}`}
        onClick={() => cambiarCantidad(producto, cantidad + 1)}
        class={`flex cursor-pointer items-center justify-center border-0 bg-transparent text-2xl font-semibold text-bottle ${
          ficha ? 'h-12.5 w-13' : 'h-10 w-11'
        }`}
      >
        +
      </button>
    </div>
  );

  if (!ficha) return grupo;
  return (
    <div class="flex items-center gap-3.5">
      {grupo}
      <p class="m-0 text-[15px] font-medium text-bottle">En tu pedido</p>
    </div>
  );
}
