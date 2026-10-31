import { useEffect, useRef, useState } from 'preact/hooks';
import type { Anuncio } from '../lib/datos';
import { alDetenerse, conGesto, irA, marcarActual } from './carrusel';
import Icono from './Icono';
import type { NombreIcono } from './iconos';
import { FONDO_CATEGORIA } from './estilosCategoria';

/**
 * Carrusel principal: pista que desliza con flechas, puntos o el dedo; en celular asoma el
 * siguiente anuncio. Sin rotación automática. Texto en HTML, nunca dentro de la foto.
 */
export default function CarruselAnuncios({ anuncios }: { anuncios: Anuncio[] }) {
  const [actual, setActual] = useState(0);
  const actualRef = useRef(0);
  const pista = useRef<HTMLDivElement>(null);
  const [anuncio, setAnuncio] = useState('');
  const n = anuncios.length;

  /** Marca el anuncio en el momento del clic (no al terminar de deslizar): dos clics seguidos avanzan dos. */
  const marcar = (i: number) => {
    actualRef.current = i;
    setActual(i);
    if (pista.current) marcarActual(pista.current, i);
    setAnuncio(`Anuncio ${i + 1} de ${n}: ${anuncios[i].titulo}`);
  };
  const ir = (destino: number) => {
    const i = ((destino % n) + n) % n;
    marcar(i);
    if (pista.current) irA(pista.current, i);
  };

  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    marcarActual(p, 0);
    const quitarDetenerse = alDetenerse(p, (i) => {
      if (i !== actualRef.current) marcar(i);
    });
    const quitarGesto = conGesto(p, (d) => ir(actualRef.current + d));
    return () => {
      quitarDetenerse();
      quitarGesto();
    };
  }, [anuncios, n]);

  if (!n) return null;

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Anuncios principales"
      class="flex min-w-0 flex-[2_1_560px] flex-col gap-1.5"
    >
      <div
        ref={pista}
        class="carrusel-pista flex flex-1 snap-x snap-mandatory gap-3 overflow-x-hidden rounded-panel"
      >
        {anuncios.map((a, i) => (
          <div
            key={a.id}
            role="group"
            aria-roledescription="anuncio"
            aria-label={`Anuncio ${i + 1} de ${n}`}
            class={`flex w-[88%] shrink-0 snap-start flex-wrap-reverse items-center gap-4.5 rounded-panel p-[clamp(18px,2.4vw,28px)] sm:w-full ${
              a.categoria ? FONDO_CATEGORIA[a.categoria] : 'bg-azul-claro'
            }`}
          >
            <div class="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
              <h3 class="m-0 text-[clamp(24px,2.4vw,32px)] leading-tight font-semibold">{a.titulo}</h3>
              {a.texto && <p class="m-0 text-[15.5px] leading-relaxed text-texto-cuerpo">{a.texto}</p>}
              {a.enlace && a.botonTexto && (
                <a
                  href={a.enlace}
                  class="mt-1 inline-flex min-h-12 items-center self-start rounded-boton bg-azul px-5 text-[15.5px] font-semibold text-blanco no-underline"
                >
                  {a.botonTexto}
                </a>
              )}
            </div>
            <div class="flex h-45 min-w-0 flex-[1_1_240px] items-center justify-center overflow-hidden rounded-[14px] sm:h-52.5">
              {a.foto ? (
                <img src={a.foto} alt={a.altFoto} loading="lazy" width="480" height="210" class="block size-full object-cover" />
              ) : (
                <span aria-hidden="true" class="flex size-36 items-center justify-center rounded-full bg-blanco text-tinta">
                  <Icono nombre={(a.categoria ? `cat-${a.categoria}` : 'escudo') as NombreIcono} tamano={64} grosor={1.4} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p class="visualmente-oculto" aria-live="polite">
        {anuncio}
      </p>
      {n > 1 && (
        <div class="flex items-center justify-center gap-0.5">
          <button
            type="button"
            onClick={() => ir(actual - 1)}
            aria-label="Anuncio anterior"
            class="flex size-11 cursor-pointer items-center justify-center rounded-full border border-texto-2 bg-blanco text-tinta"
          >
            <Icono nombre="anterior" tamano={18} grosor={2.4} />
          </button>
          {anuncios.map((b, j) => (
            <button
              key={b.id}
              type="button"
              onClick={() => ir(j)}
              aria-label={`Ver anuncio ${j + 1} de ${n}`}
              aria-current={j === actual ? 'true' : undefined}
              class="flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent"
            >
              <span
                aria-hidden="true"
                class={`h-2.5 rounded-full transition-[width,background-color] duration-media ease-salida ${
                  j === actual ? 'w-6.5 bg-azul' : 'w-2.5 bg-texto-2'
                }`}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => ir(actual + 1)}
            aria-label="Anuncio siguiente"
            class="flex size-11 cursor-pointer items-center justify-center rounded-full border border-texto-2 bg-blanco text-tinta"
          >
            <Icono nombre="siguiente" tamano={18} grosor={2.4} />
          </button>
        </div>
      )}
    </div>
  );
}
