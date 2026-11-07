import { categoria } from '@/dominio/categorias';
import { urlProducto, type ProductoResumen } from '@/dominio/producto';
import { formatearPrecio } from '@/dominio/formato';
import { enlaceWhatsApp, mensajeDisponibilidad, mensajeFormula } from '@/dominio/whatsapp';
import { atributosTransicion, nombresDeTransicion } from './transiciones';
import ControlCantidad from '@/funcionalidades/pedido/ControlCantidad';
import IlustracionProducto from './IlustracionProducto';
import { FONDO_CATEGORIA, PUNTO_CATEGORIA } from '@/compartido/ui/estilosCategoria';

interface Props {
  producto: ProductoResumen;
  whatsapp: string;
  /** Nivel del título según la página (h2 en el catálogo, h3 dentro de una sección). */
  nivel?: 2 | 3;
  /** Vista rápida: si existe, un clic normal en la tarjeta abre el diálogo en vez de navegar. */
  onVer?: (producto: ProductoResumen, origen: HTMLElement) => void;
  /** Mientras la ficha rápida está abierta, la imagen cede su nombre de transición. */
  sinTransicion?: boolean;
  /** Tarjeta que se acaba de elegir para la vista rápida: su imagen crece hasta la ficha. */
  elegida?: boolean;
  /** Se llama al pasar el puntero o enfocar el producto, para precargar su ficha. */
  onPrecargar?: (producto: ProductoResumen) => void;
}

export default function TarjetaProducto({
  producto: p,
  whatsapp,
  nivel = 3,
  onVer,
  sinTransicion,
  elegida,
  onPrecargar,
}: Props) {
  const Titulo = `h${nivel}` as 'h2' | 'h3';
  const url = urlProducto(p);
  const rx = p.condicionVenta === 'formula';
  const agotado = p.disponibilidad === 'agotado';
  const vt = nombresDeTransicion(p.id);

  const abrir = (e: MouseEvent) => {
    if (!onVer || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onVer(p, e.currentTarget as HTMLElement);
  };

  return (
    <article class="group flex w-full min-w-0 flex-col overflow-hidden rounded-tarjeta border border-celadon/60 bg-blanco text-[15px] leading-snug transition-colors duration-rapida hover-fino:border-bottle">
      <a
        href={url}
        onClick={abrir}
        tabIndex={-1}
        aria-hidden="true"
        class={`relative flex h-35 items-center justify-center overflow-hidden no-underline ${FONDO_CATEGORIA[p.categoria]}`}
      >
        <span
          class="flex size-full items-center justify-center transition-transform duration-rapida ease-salida hover-fino-grupo:scale-[1.03]"
          {...(sinTransicion ? {} : atributosTransicion(vt.foto, elegida))}
        >
          {p.foto ? (
            <img src={p.foto} alt="" loading="lazy" decoding="async" width={140} height={140} class="max-h-30 w-auto object-contain" />
          ) : (
            <IlustracionProducto categoria={p.categoria} presentacion={p.presentacion} ancho={86} />
          )}
        </span>
        {rx && (
          <span class="absolute top-2.5 left-2.5 rounded-full bg-amber px-2.5 py-0.5 text-xs font-semibold text-blanco">
            Con fórmula médica
          </span>
        )}
        {p.condicionVenta === 'libre' && p.descuentoPct && (
          <span class="absolute top-2.5 left-2.5 rounded-full bg-amber px-2.5 py-0.5 text-xs font-semibold text-blanco">
            Ahorra {p.descuentoPct} %
          </span>
        )}
        {agotado && (
          <span class="absolute top-2.5 right-2.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-blanco">
            Agotado
          </span>
        )}
      </a>
      <div class="flex flex-1 flex-col gap-1 px-3.5 pt-3 pb-3.5">
        <p class="m-0 flex items-center gap-1.5 text-[12.5px] text-muted">
          <span aria-hidden="true" class={`size-2 shrink-0 rounded-full ${PUNTO_CATEGORIA[p.categoria]}`} />
          {categoria(p.categoria).nombre}
        </p>
        <Titulo class="m-0 min-h-[2.6em] text-[15px] leading-tight font-semibold">
          <a
            href={url}
            onClick={abrir}
            class="text-ink no-underline hover:underline"
            {...(sinTransicion ? {} : atributosTransicion(vt.nombre))}
            onPointerEnter={() => onPrecargar?.(p)}
            onFocus={() => onPrecargar?.(p)}
          >
            {p.nombre}
          </a>
        </Titulo>
        <p class="m-0 text-[13px] leading-snug text-muted">{p.presentacion}</p>
        <div class="mt-auto flex flex-col gap-2.5 pt-2">
          {p.condicionVenta === 'libre' ? (
            <p class="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span class="text-[19px] leading-tight font-bold">{formatearPrecio(p.precio)}</span>
              {p.precioAntes && (
                <span class="text-[12.5px] text-amber-ink">
                  Antes <s>{formatearPrecio(p.precioAntes)}</s>
                </span>
              )}
            </p>
          ) : (
            <p class="m-0 text-[13px] text-muted">Precio según disponibilidad</p>
          )}
          {rx ? (
            <a
              href={enlaceWhatsApp(whatsapp, mensajeFormula(p.nombre))}
              aria-label={`Consultar por WhatsApp con fórmula: ${p.nombre}`}
              class="flex min-h-11 w-full items-center justify-center rounded-boton bg-amber text-center text-sm font-semibold text-blanco no-underline"
            >
              Consultar por WhatsApp
            </a>
          ) : agotado ? (
            <a
              href={enlaceWhatsApp(whatsapp, mensajeDisponibilidad(p.nombre))}
              aria-label={`Preguntar disponibilidad por WhatsApp: ${p.nombre}`}
              class="flex min-h-11 w-full items-center justify-center rounded-boton border-2 border-muted bg-blanco text-center text-sm font-semibold text-ink no-underline"
            >
              Preguntar disponibilidad
            </a>
          ) : (
            <ControlCantidad producto={p} tamano="tarjeta" />
          )}
        </div>
      </div>
    </article>
  );
}
