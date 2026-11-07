import Boton from '@/compartido/ui/Boton';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Anuncio } from '@/dominio/sitio';
import { alDetenerse, autoReproducir, conGesto, irA, marcarActual, type Autoplay } from './carrusel';
import Icono from '@/compartido/ui/Icono';
import type { NombreIcono } from '@/compartido/ui/iconos';
import { FONDO_CATEGORIA } from '@/compartido/ui/estilosCategoria';

/**
 * Carrusel principal: avanza solo cada 6 s y se detiene con el puntero o el foco encima. No tiene controles
 * visibles: unos chips muestran cuántos anuncios hay y en cuál va. Se desliza con el dedo y, con el foco
 * dentro, con las flechas del teclado. En celular asoma el siguiente anuncio. Texto en HTML, nunca en la foto.
 */
export default function CarruselAnuncios({ anuncios }: { anuncios: Anuncio[] }) {
  const [actual, setActual] = useState(0);
  const actualRef = useRef(0);
  const pista = useRef<HTMLDivElement>(null);
  const [anuncio, setAnuncio] = useState('');
  const region = useRef<HTMLDivElement>(null);
  const auto = useRef<Autoplay | null>(null);
  const n = anuncios.length;

  /** Marca el anuncio de una vez, sin esperar a que termine de deslizar. */
  const marcar = (i: number, anunciar = true) => {
    actualRef.current = i;
    setActual(i);
    if (pista.current) marcarActual(pista.current, i);
    if (anunciar) setAnuncio(`Anuncio ${i + 1} de ${n}: ${anuncios[i].titulo}`);
  };
  /** Cambio pedido por la persona: se anuncia y reinicia la cuenta de la rotación automática. */
  const ir = (destino: number, anunciar = true) => {
    const i = ((destino % n) + n) % n;
    marcar(i, anunciar);
    if (pista.current) irA(pista.current, i);
    if (anunciar) auto.current?.reiniciar();
  };

  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    marcarActual(p, 0);
    const quitarDetenerse = alDetenerse(p, (i) => {
      if (i !== actualRef.current) marcar(i);
    });
    const quitarGesto = conGesto(p, (d) => ir(actualRef.current + d));
    if (region.current && n > 1) {
      auto.current = autoReproducir(region.current, () => ir(actualRef.current + 1, false));
    }
    return () => {
      quitarDetenerse();
      quitarGesto();
      auto.current?.destruir();
    };
  }, [anuncios, n]);

  if (!n) return null;

  return (
    // Sin flechas visibles, el teclado es la forma de llegar a los anuncios que están inert.
    // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
    <div
      ref={region}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Anuncios principales"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') ir(actualRef.current + 1);
        if (e.key === 'ArrowLeft') ir(actualRef.current - 1);
      }}
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
              a.categoria ? FONDO_CATEGORIA[a.categoria] : 'bg-celadon'
            }`}
          >
            <div class="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
              <h3 class="m-0 text-[clamp(24px,2.4vw,32px)] leading-tight font-semibold">{a.titulo}</h3>
              {a.texto && <p class="m-0 text-[15.5px] leading-relaxed text-muted">{a.texto}</p>}
              {a.enlace && a.botonTexto && (
                <Boton tamano="compacto" class="mt-1 self-start" href={a.enlace}>
                  {a.botonTexto}
                </Boton>
              )}
            </div>
            <div class="flex h-45 min-w-0 flex-[1_1_240px] items-center justify-center overflow-hidden rounded-[14px] sm:h-52.5">
              {a.foto ? (
                <img src={a.foto} alt={a.altFoto} loading="lazy" width="480" height="210" class="block size-full object-cover" />
              ) : (
                <span aria-hidden="true" class="flex size-36 items-center justify-center rounded-full bg-blanco text-ink">
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
        <div aria-hidden="true" class="flex items-center justify-center gap-1.5 pt-1">
          {anuncios.map((b, j) => (
            <span
              key={b.id}
              data-chip-anuncio={j === actual ? 'actual' : undefined}
              class={`h-1.5 rounded-full transition-[width,background-color] duration-media ease-salida ${
                j === actual ? 'w-5 bg-bottle' : 'w-1.5 bg-muted/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
