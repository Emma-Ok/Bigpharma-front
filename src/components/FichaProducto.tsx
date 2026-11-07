import { useEffect, useRef, useState } from 'preact/hooks';
import { cuandoConvenga3d } from '../scripts/3d/cargador';
import { categoria, TIPOS, type Producto } from '../lib/catalogo';
import { formatearPrecio } from '../lib/formato';
import { enlaceWhatsApp, mensajeDisponibilidad, mensajeFormula } from '../lib/whatsapp';
import ControlCantidad from './ControlCantidad';
import Icono from './Icono';
import IlustracionProducto, { formaDe } from './IlustracionProducto';
import { FONDO_CATEGORIA, HEX_CATEGORIA, PUNTO_CATEGORIA } from './estilosCategoria';
import { atributosTransicion, nombresDeTransicion } from './TarjetaProducto';

interface Props {
  producto: Producto;
  whatsapp: string;
  /** «Domicilio en 40 minutos a Chapinero.» */
  entrega: string;
  /** h1 en /producto/[slug], h2 en la vista rápida. */
  nivel: 1 | 2;
  idTitulo?: string;
}

const DISPONIBILIDAD = {
  disponible: { texto: 'Disponible para domicilio', clase: 'text-bottle', icono: 'info' },
  pocas: { texto: 'Quedan pocas unidades', clase: 'text-ink', icono: 'aviso' },
  agotado: { texto: 'Agotado por ahora', clase: 'text-ink', icono: 'info' },
} as const;

/**
 * Ficha del producto. Indicaciones, uso y advertencias se muestran tal como
 * vienen de la hoja (copiadas del empaque o del inserto aprobado por el Invima).
 */
export default function FichaProducto({ producto: p, whatsapp, entrega, nivel, idTitulo = 'ficha-titulo' }: Props) {
  const [foto, setFoto] = useState(0);
  const escena = useRef<HTMLDivElement>(null);

  // Sin foto: el empaque 3D (caja, frasco, tubo o paquete) reemplaza al dibujo cuando conviene cargarlo.
  useEffect(() => {
    const el = escena.current;
    if (!el) return;
    let vigente = true;
    let destruir: (() => void) | undefined;
    cuandoConvenga3d(async () => {
      if (!vigente) return;
      const { iniciarEmpaque } = await import('../scripts/3d/empaque');
      if (vigente && el.isConnected) {
        destruir = iniciarEmpaque(el, {
          forma: formaDe(p.presentacion, p.categoria),
          color: HEX_CATEGORIA[p.categoria].color,
          fondo: HEX_CATEGORIA[p.categoria].fondo,
        });
      }
    });
    return () => {
      vigente = false;
      destruir?.();
    };
  }, [p.id]);
  const Titulo = `h${nivel}` as 'h1' | 'h2';
  const Subtitulo = `h${nivel + 1}` as 'h2' | 'h3';
  const rx = p.condicionVenta === 'formula';
  const med = p.tipo === 'med';
  const vt = nombresDeTransicion(p.id);
  const disp = DISPONIBILIDAD[p.disponibilidad];
  const condicion = rx ? 'Con fórmula médica' : med ? 'Venta libre' : TIPOS[p.tipo];

  const filas: [string, string | undefined][] = [
    [med ? 'Laboratorio' : 'Marca', p.laboratorioMarca],
    ['Principio activo', p.principioActivo],
    ['Concentración', p.concentracion],
    ['Forma farmacéutica', p.formaFarmaceutica],
    ['Presentación', p.presentacion],
    [p.tipo === 'cos' ? 'Notificación sanitaria' : 'Registro sanitario Invima', p.registroSanitario],
    ['Condición de venta', med ? (rx ? 'Venta bajo fórmula médica' : 'Venta libre') : undefined],
  ];

  return (
    <div class="flex flex-col gap-6.5">
      <div class="flex flex-wrap gap-x-10 gap-y-6">
        <div class="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
          <div
            class={`relative flex h-[clamp(240px,28vw,340px)] items-center justify-center overflow-hidden rounded-[18px] ${FONDO_CATEGORIA[p.categoria]}`}
          >
            <span class="flex size-full items-center justify-center" {...atributosTransicion(vt.foto, true)}>
              {p.fotos.length ? (
                <img
                  src={p.fotos[foto]}
                  alt={`${p.nombre}, ${p.presentacion}`}
                  width={340}
                  height={340}
                  class="max-h-full w-auto object-contain"
                />
              ) : (
                <IlustracionProducto categoria={p.categoria} presentacion={p.presentacion} ancho={160} grosor={1.6} />
              )}
            </span>
            {!p.fotos.length && <div ref={escena} aria-hidden="true" class="escena-empaque pointer-events-none absolute inset-0" />}
            {p.condicionVenta === 'libre' && p.descuentoPct && (
              <span class="absolute top-3.5 left-3.5 rounded-full bg-amber px-3 py-1 text-[13px] font-semibold text-blanco">
                Ahorra {p.descuentoPct} %
              </span>
            )}
          </div>
          {p.fotos.length > 1 && (
            <ul class="m-0 grid list-none grid-cols-4 gap-2 p-0" aria-label="Fotos del producto">
              {p.fotos.map((src, i) => (
                <li key={src}>
                  <button
                    type="button"
                    aria-label={`Ver foto ${i + 1} de ${p.fotos.length}`}
                    aria-pressed={i === foto}
                    onClick={() => setFoto(i)}
                    class={`flex h-16 w-full cursor-pointer items-center justify-center overflow-hidden rounded-boton bg-blanco p-1 ${
                      i === foto ? 'border-2 border-bottle' : 'border border-muted/40'
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" class="max-h-full w-auto object-contain" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div class="flex min-w-0 flex-[1_1_340px] flex-col gap-3 pt-1">
          <p class="m-0 flex items-center gap-2 pr-14 text-sm text-muted">
            <span aria-hidden="true" class={`size-2.5 shrink-0 rounded-full ${PUNTO_CATEGORIA[p.categoria]}`} />
            {categoria(p.categoria).nombre}
          </p>
          <Titulo
            id={idTitulo}
            class="m-0 pr-14 text-[clamp(24px,2.6vw,32px)] leading-tight font-semibold"
            {...atributosTransicion(vt.nombre)}
          >
            {p.nombre}
          </Titulo>
          <p class="m-0 text-[15px] text-muted">
            {p.laboratorioMarca}, {p.presentacion}
          </p>
          <div class="flex flex-wrap items-center gap-x-3.5 gap-y-2">
            <span
              class={`rounded-full px-3 py-1 text-[13.5px] font-semibold ${
                rx ? 'bg-celadon text-amber-ink' : 'bg-celadon text-bottle'
              }`}
            >
              {condicion}
            </span>
            <span class={`inline-flex items-center gap-1.5 text-sm font-medium ${disp.clase}`}>
              <Icono nombre={disp.icono} tamano={16} grosor={2.4} />
              {disp.texto}
            </span>
          </div>

          {p.condicionVenta === 'libre' ? (
            <div class="mt-1 flex flex-col gap-0.5">
              <p class="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span class="text-[32px] leading-tight font-bold">{formatearPrecio(p.precio)}</span>
                {p.precioAntes && (
                  <span class="text-[15px] text-amber-ink">
                    Antes <s>{formatearPrecio(p.precioAntes)}</s>
                  </span>
                )}
              </p>
              {p.precioPorUnidad && p.unidad && (
                <p class="m-0 text-sm text-muted">
                  Precio por unidad: {formatearPrecio(p.precioPorUnidad)} por {p.unidad}
                </p>
              )}
            </div>
          ) : (
            <p class="mt-1 mb-0 rounded-boton bg-celadon px-3.5 py-3 text-[15px] leading-normal text-amber-ink">
              Para comprarlo, envíanos la foto de tu fórmula médica vigente. Te confirmamos disponibilidad y precio por
              WhatsApp.
            </p>
          )}

          <div class="mt-1.5 flex flex-col gap-2.5">
            {rx ? (
              <a
                href={enlaceWhatsApp(whatsapp, mensajeFormula(p.nombre))}
                class="flex min-h-13.5 w-full items-center justify-center rounded-[14px] bg-amber text-base font-semibold text-blanco no-underline"
              >
                Enviar fórmula por WhatsApp
              </a>
            ) : p.disponibilidad === 'agotado' ? (
              <a
                href={enlaceWhatsApp(whatsapp, mensajeDisponibilidad(p.nombre))}
                class="flex min-h-13.5 w-full items-center justify-center rounded-[14px] border-2 border-muted bg-blanco text-base font-semibold text-ink no-underline"
              >
                Preguntar disponibilidad por WhatsApp
              </a>
            ) : (
              <ControlCantidad producto={p} tamano="ficha" />
            )}
            <p class="m-0 flex items-start gap-2 text-sm leading-normal text-muted">
              <Icono nombre="ubicacion" tamano={18} class="mt-0.5" />
              {entrega}
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-start gap-x-10 gap-y-6">
        <div class="min-w-0 flex-[1_1_340px] border-t border-celadon">
          <Seccion titulo="Para qué sirve" texto={p.paraQueSirve} abierta />
          <Seccion titulo="Cómo se usa" texto={p.comoSeUsa} />
          <Seccion titulo="Advertencias" texto={p.advertencias} />
        </div>
        <section
          aria-labelledby={`${idTitulo}-info`}
          class="min-w-0 flex-[1_1_340px] rounded-tarjeta bg-celadon px-5 py-4.5"
        >
          <Subtitulo id={`${idTitulo}-info`} class="m-0 mb-2.5 text-[16.5px] font-semibold">
            Información del producto
          </Subtitulo>
          <dl class="m-0 flex flex-col">
            {filas
              .filter((f): f is [string, string] => !!f[1])
              .map(([k, v]) => (
                <div key={k} class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-b border-celadon/60 py-2">
                  <dt class="text-sm text-muted">{k}</dt>
                  <dd class="m-0 text-[14.5px] font-medium">{v}</dd>
                </div>
              ))}
          </dl>
        </section>
      </div>

      {med && (
        <p class="m-0 rounded-boton bg-celadon px-4 py-3 text-[15px] font-semibold text-bottle">
          {rx ? 'Este medicamento requiere fórmula médica.' : 'Si los síntomas persisten, consulte a su médico.'}
        </p>
      )}
    </div>
  );
}

function Seccion({ titulo, texto, abierta = false }: { titulo: string; texto: string; abierta?: boolean }) {
  return (
    <details open={abierta} class="border-b border-celadon">
      <summary class="min-h-11 cursor-pointer py-3.5 text-[16.5px] font-semibold">{titulo}</summary>
      <p class="m-0 mb-4 text-[15px] leading-relaxed whitespace-pre-line text-muted">{texto}</p>
    </details>
  );
}
