import { useEffect, useRef, useState } from 'preact/hooks';
import { contarUnidades, resolverLineas, subtotal } from '@/dominio/carrito';
import { progresoDomicilio } from '@/dominio/domicilio';
import type { ProductoResumen } from '@/dominio/producto';
import { formatearPrecio } from '@/dominio/formato';
import { enlaceWhatsApp, mensajePedido } from '@/dominio/whatsapp';
import { FORMAS_DE_PAGO, type FormaDePago } from '@/dominio/pedido';
import { cambiarCantidad } from './acciones';
import { celebrarDesde } from './movimiento';
import Icono from './Icono';
import ProgresoDomicilio from './ProgresoDomicilio';
import VaciarPedido from './VaciarPedido';
import { usarCarrito, usarCatalogo } from './usarCarrito';

interface Props {
  productos: ProductoResumen[];
  whatsapp: string;
  umbral: number;
}

type Campo = 'nombre' | 'direccion' | 'autorizo';

const ERRORES: Record<Campo, string> = {
  nombre: 'Escribe tu nombre.',
  direccion: 'Escribe tu barrio y dirección.',
  autorizo: 'Para enviar el pedido, autoriza el tratamiento de tus datos.',
};

/**
 * Resumen editable, datos de entrega, vista previa del mensaje y envío a WhatsApp.
 * Ley 1581: los datos solo viajan en el mensaje; no se guardan en el navegador ni en un servidor.
 */
export default function PaginaPedido({ productos, whatsapp, umbral }: Props) {
  const carrito = usarCarrito();
  const catalogo = usarCatalogo(productos) ?? productos;
  const lineas = resolverLineas(carrito, catalogo);
  const total = subtotal(lineas);
  const unidades = contarUnidades(lineas);
  const { falta, gratis } = progresoDomicilio(total, umbral);

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [pago, setPago] = useState<FormaDePago>(FORMAS_DE_PAGO[0]);
  const [autorizo, setAutorizo] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [enviado, setEnviado] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const vacio = useRef<HTMLParagraphElement>(null);
  const [recienVaciado, setRecienVaciado] = useState(false);
  // Después de vaciar, la lista desaparece: el foco pasa al aviso de pedido vacío.
  useEffect(() => {
    if (recienVaciado && !lineas.length) vacio.current?.focus();
  }, [recienVaciado, lineas.length]);
  const refs = {
    nombre: useRef<HTMLInputElement>(null),
    direccion: useRef<HTMLInputElement>(null),
    autorizo: useRef<HTMLInputElement>(null),
  };

  const vistaPrevia = mensajePedido(lineas, {
    nombre: nombre.trim() || '[nombre]',
    direccion: direccion.trim() || '[barrio y dirección]',
    pago,
  });

  const enviar = (e: Event) => {
    e.preventDefault();
    const nuevos: Partial<Record<Campo, string>> = {};
    if (!nombre.trim()) nuevos.nombre = ERRORES.nombre;
    if (!direccion.trim()) nuevos.direccion = ERRORES.direccion;
    if (!autorizo) nuevos.autorizo = ERRORES.autorizo;
    setErrores(nuevos);
    const primero = (Object.keys(nuevos) as Campo[])[0];
    if (primero) {
      refs[primero].current?.focus();
      return;
    }
    const url = enlaceWhatsApp(whatsapp, mensajePedido(lineas, { nombre, direccion, pago }));
    setEnviado(url);
    const abrir = () => {
      const ventana = window.open(url, '_blank', 'noopener');
      if (!ventana) window.location.href = url;
    };
    // Celebración breve desde el botón y luego WhatsApp (sin animación, se abre de una vez).
    const boton = (e.currentTarget as HTMLFormElement).querySelector('button[type="submit"]');
    if (boton && celebrarDesde(boton)) setTimeout(abrir, 650);
    else abrir();
  };

  if (!lineas.length) {
    return (
      <div class="flex flex-col items-start gap-4 rounded-panel border border-dashed border-muted p-6">
        <p ref={vacio} tabIndex={-1} class="m-0 text-lg font-semibold focus:outline-none">
          Tu pedido está vacío
        </p>
        <p class="m-0 text-muted">Agrega productos desde el catálogo y vuelve aquí para enviarlo por WhatsApp.</p>
        <a href="/catalogo" class="inline-flex min-h-12 items-center rounded-boton bg-bottle px-5 font-semibold text-blanco no-underline">
          Ver catálogo
        </a>
      </div>
    );
  }

  const campo = (id: Campo) => ({
    'aria-invalid': errores[id] ? true : undefined,
    'aria-describedby': [id === 'direccion' ? 'direccion-ayuda' : '', errores[id] ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined,
  });

  return (
    <div class="flex flex-col gap-8 lg:flex-row lg:items-start">
      <section aria-labelledby="prod-pedido" class="flex min-w-0 flex-1 flex-col gap-4">
        <h2 id="prod-pedido" ref={titulo} tabIndex={-1} aria-live="polite" class="m-0 text-xl font-semibold focus:outline-none">
          {unidades === 1 ? '1 producto' : `${unidades} productos`}
        </h2>
        <ul class="m-0 flex list-none flex-col p-0">
          {lineas.map((l) => (
            <li key={l.producto.id} class="flex items-center justify-between gap-3 border-b border-celadon/60 py-3.5">
              <div class="min-w-0">
                <p class="m-0 font-semibold">{l.producto.nombre}</p>
                <p class="m-0 text-sm text-muted">
                  {l.producto.presentacion}, {formatearPrecio(l.producto.precio)} c/u
                </p>
                <p class="m-0 mt-0.5 font-bold">{formatearPrecio(l.subtotal)}</p>
              </div>
              <div
                role="group"
                aria-label={`Cantidad de ${l.producto.nombre}`}
                class="flex shrink-0 items-center rounded-boton border-2 border-bottle bg-celadon text-bottle"
              >
                <button
                  type="button"
                  aria-label={`Quitar una unidad: ${l.producto.nombre}`}
                  onClick={() => {
                    cambiarCantidad(l.producto, l.cantidad - 1);
                    // Si la línea desaparece, el foco pasa al título de la lista.
                    if (l.cantidad === 1) titulo.current?.focus();
                  }}
                  class="flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent text-2xl font-semibold text-bottle"
                >
                  −
                </button>
                <span class="min-w-7 text-center font-bold text-ink">{l.cantidad}</span>
                <button
                  type="button"
                  aria-label={`Agregar una unidad: ${l.producto.nombre}`}
                  onClick={() => cambiarCantidad(l.producto, l.cantidad + 1)}
                  class="flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent text-2xl font-semibold text-bottle"
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
        <dl aria-live="polite" class="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt class="font-semibold">Subtotal</dt>
          <dd class="m-0 text-right text-lg font-bold">{formatearPrecio(total)}</dd>
          <dt class="font-semibold">Domicilio</dt>
          <dd class="m-0 text-right text-muted">
            {gratis ? 'Gratis' : `Te faltan ${formatearPrecio(falta)} para que sea gratis`}
          </dd>
        </dl>
        <ProgresoDomicilio total={total} umbral={umbral} variante="panel" />
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <a href="/catalogo" class="inline-flex min-h-11 items-center gap-2 font-semibold text-bottle">
            <Icono nombre="flecha-atras" tamano={18} />
            Seguir comprando
          </a>
          <VaciarPedido onVaciado={() => setRecienVaciado(true)} />
        </div>
      </section>

      <form noValidate onSubmit={enviar} class="flex min-w-0 flex-1 flex-col gap-5 rounded-panel border border-celadon p-[clamp(18px,3vw,28px)]">
        <fieldset class="m-0 flex flex-col gap-4 border-0 p-0">
          <legend class="mb-1 p-0 text-lg font-semibold">Datos de entrega</legend>
          <div class="flex flex-col gap-1.5">
            <label htmlFor="nombre" class="font-medium">
              Nombre
            </label>
            <input
              ref={refs.nombre}
              id="nombre"
              name="nombre"
              type="text"
              autoComplete="name"
              required
              value={nombre}
              onInput={(e) => setNombre(e.currentTarget.value)}
              {...campo('nombre')}
              class="min-h-12 rounded-boton border-2 border-muted bg-blanco px-3.5 text-base text-ink aria-invalid:border-error"
            />
            {errores.nombre && (
              <p id="nombre-error" class="m-0 flex items-start gap-1.5 text-sm font-semibold text-error">
                <Icono nombre="aviso" tamano={18} />
                {errores.nombre}
              </p>
            )}
          </div>
          <div class="flex flex-col gap-1.5">
            <label htmlFor="direccion" class="font-medium">
              Barrio y dirección
            </label>
            <input
              ref={refs.direccion}
              id="direccion"
              name="direccion"
              type="text"
              autoComplete="street-address"
              required
              value={direccion}
              onInput={(e) => setDireccion(e.currentTarget.value)}
              {...campo('direccion')}
              class="min-h-12 rounded-boton border-2 border-muted bg-blanco px-3.5 text-base text-ink aria-invalid:border-error"
            />
            <span id="direccion-ayuda" class="text-sm text-muted">
              Incluye torre, apartamento o un punto de referencia.
            </span>
            {errores.direccion && (
              <p id="direccion-error" class="m-0 flex items-start gap-1.5 text-sm font-semibold text-error">
                <Icono nombre="aviso" tamano={18} />
                {errores.direccion}
              </p>
            )}
          </div>
        </fieldset>

        <fieldset class="m-0 flex flex-col gap-1 border-0 p-0">
          <legend class="mb-1 p-0 text-lg font-semibold">¿Cómo vas a pagar?</legend>
          {FORMAS_DE_PAGO.map((f) => (
            <label key={f} class="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="pago"
                value={f}
                checked={pago === f}
                onChange={() => setPago(f)}
                class="size-5 accent-bottle"
              />
              {f}
            </label>
          ))}
        </fieldset>

        <div class="flex flex-col gap-1.5">
          <label class="flex cursor-pointer items-start gap-3 leading-snug">
            <input
              ref={refs.autorizo}
              type="checkbox"
              name="datos"
              required
              checked={autorizo}
              onChange={(e) => setAutorizo(e.currentTarget.checked)}
              {...campo('autorizo')}
              class="mt-0.5 size-5 shrink-0 accent-bottle"
            />
            <span>
              Autorizo el tratamiento de mis datos según la{' '}
              <a href="/politica-de-datos" class="font-semibold text-bottle">
                política de tratamiento de datos
              </a>
              .
            </span>
          </label>
          {errores.autorizo && (
            <p id="autorizo-error" class="m-0 flex items-start gap-1.5 text-sm font-semibold text-error">
              <Icono nombre="aviso" tamano={18} />
              {errores.autorizo}
            </p>
          )}
        </div>

        <section aria-labelledby="vista-previa" class="flex flex-col gap-2">
          <h2 id="vista-previa" class="m-0 text-lg font-semibold">
            Así llega tu mensaje
          </h2>
          <div class="rounded-boton bg-celadon p-4 text-[15px] leading-relaxed whitespace-pre-wrap text-ink">{vistaPrevia}</div>
          <p class="m-0 text-sm text-muted">
            Se abre WhatsApp con tu pedido listo. Te confirmamos el total con domicilio antes de cobrar.
          </p>
        </section>

        <button
          type="submit"
          class="flex min-h-13.5 cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border-0 bg-bottle text-[17px] font-semibold text-blanco"
        >
          <Icono nombre="chat" />
          Enviar pedido por WhatsApp
        </button>
        {enviado && (
          <p role="status" class="m-0 text-[15px] text-muted">
            Abrimos WhatsApp con tu pedido. Si no se abrió,{' '}
            <a href={enviado} class="font-semibold text-bottle">
              toca aquí para enviarlo
            </a>
            .
          </p>
        )}
      </form>
    </div>
  );
}
