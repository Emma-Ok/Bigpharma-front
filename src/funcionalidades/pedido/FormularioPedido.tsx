import { useRef, useState } from 'preact/hooks';
import type { LineaResuelta } from '@/dominio/carrito';
import { FORMAS_DE_PAGO, validarDatosEntrega, type CampoEntrega, type FormaDePago } from '@/dominio/pedido';
import { enlaceWhatsApp, mensajePedido } from '@/dominio/whatsapp';
import Boton from '@/compartido/ui/Boton';
import Icono from '@/compartido/ui/Icono';

interface Props {
  lineas: LineaResuelta[];
  whatsapp: string;
}

/**
 * Datos de entrega, vista previa del mensaje y envío a WhatsApp.
 * Ley 1581: los datos solo viajan en el mensaje; no se guardan en el navegador ni en un servidor.
 */
export default function FormularioPedido({ lineas, whatsapp }: Props) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [pago, setPago] = useState<FormaDePago>(FORMAS_DE_PAGO[0]);
  const [autorizo, setAutorizo] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<CampoEntrega, string>>>({});
  const [enviado, setEnviado] = useState<string | null>(null);
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
    const nuevos = validarDatosEntrega({ nombre, direccion, autorizo });
    setErrores(nuevos);
    const primero = (Object.keys(nuevos) as CampoEntrega[])[0];
    if (primero) {
      refs[primero].current?.focus();
      return;
    }
    const url = enlaceWhatsApp(whatsapp, mensajePedido(lineas, { nombre, direccion, pago }));
    // Dentro del mismo evento: nada va antes de abrir WhatsApp. Sin la opción «noopener», porque con ella
    // window.open devuelve null siempre y no se distingue de una ventana bloqueada.
    const ventana = window.open(url, '_blank');
    if (ventana) ventana.opener = null;
    else window.location.href = url;
    setEnviado(url);
  };

  const campo = (id: CampoEntrega) => ({
    'aria-invalid': errores[id] ? true : undefined,
    'aria-describedby': [id === 'direccion' ? 'direccion-ayuda' : '', errores[id] ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined,
  });

  return (
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

      <Boton type="submit" tamano="grande">
          <Icono nombre="chat" />
          Enviar pedido por WhatsApp
        </Boton>
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
  );
}
