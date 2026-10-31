/**
 * Pista de carrusel con scroll-snap: desliza con flechas, puntos y el gesto de deslizar.
 * Sin rotación automática (CLAUDE.md). Con movimiento reducido el cambio es instantáneo.
 * La usan la barra de avisos (script de Astro) y el carrusel de anuncios (Preact).
 */

function diapositivas(pista: HTMLElement): HTMLElement[] {
  return [...pista.children] as HTMLElement[];
}

export function irA(pista: HTMLElement, indice: number) {
  const lista = diapositivas(pista);
  if (!lista.length) return;
  const i = ((indice % lista.length) + lista.length) % lista.length;
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  pista.scrollTo({ left: lista[i].offsetLeft - lista[0].offsetLeft, behavior: reducido ? 'auto' : 'smooth' });
}

/** Índice de la diapositiva más cercana a la posición actual de la pista. */
export function indiceActual(pista: HTMLElement): number {
  const lista = diapositivas(pista);
  if (!lista.length) return 0;
  const inicio = lista[0].offsetLeft;
  let mejor = 0;
  lista.forEach((d, i) => {
    if (Math.abs(d.offsetLeft - inicio - pista.scrollLeft) < Math.abs(lista[mejor].offsetLeft - inicio - pista.scrollLeft)) mejor = i;
  });
  return mejor;
}

/** Marca la diapositiva actual: las demás quedan inert (fuera del foco y de los lectores de pantalla). */
export function marcarActual(pista: HTMLElement, actual: number) {
  diapositivas(pista).forEach((d, i) => {
    d.inert = i !== actual;
    d.setAttribute('aria-hidden', String(i !== actual));
  });
}

/** Avisa cuando la pista se detiene en una diapositiva (después de deslizar o de un gesto). */
export function alDetenerse(pista: HTMLElement, fn: (indice: number) => void): () => void {
  let espera = 0;
  const avisar = () => fn(indiceActual(pista));
  const alDesplazar = () => {
    window.clearTimeout(espera);
    espera = window.setTimeout(avisar, 120);
  };
  const conScrollend = 'onscrollend' in window;
  pista.addEventListener(conScrollend ? 'scrollend' : 'scroll', conScrollend ? avisar : alDesplazar, { passive: true });
  return () => {
    window.clearTimeout(espera);
    pista.removeEventListener(conScrollend ? 'scrollend' : 'scroll', conScrollend ? avisar : alDesplazar);
  };
}

/**
 * Gesto de deslizar (dedo, lápiz o arrastre con el mouse). La pista no es desplazable por el usuario
 * (overflow oculto, así no es una región que el teclado no pueda recorrer); el gesto llama a `mover`.
 */
export function conGesto(pista: HTMLElement, mover: (direccion: 1 | -1) => void): () => void {
  let x0 = 0;
  let y0 = 0;
  let activo = false;
  let arrastro = false;
  const abajo = (e: PointerEvent) => {
    activo = true;
    arrastro = false;
    x0 = e.clientX;
    y0 = e.clientY;
  };
  const arriba = (e: PointerEvent) => {
    if (!activo) return;
    activo = false;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      arrastro = true;
      mover(dx < 0 ? 1 : -1);
    }
  };
  // Un arrastre no debe terminar abriendo el enlace sobre el que empezó.
  const clic = (e: MouseEvent) => {
    if (arrastro) {
      e.preventDefault();
      e.stopPropagation();
      arrastro = false;
    }
  };
  const cancelar = () => (activo = false);
  pista.addEventListener('pointerdown', abajo);
  pista.addEventListener('pointerup', arriba);
  pista.addEventListener('pointercancel', cancelar);
  pista.addEventListener('click', clic, true);
  return () => {
    pista.removeEventListener('pointerdown', abajo);
    pista.removeEventListener('pointerup', arriba);
    pista.removeEventListener('pointercancel', cancelar);
    pista.removeEventListener('click', clic, true);
  };
}
