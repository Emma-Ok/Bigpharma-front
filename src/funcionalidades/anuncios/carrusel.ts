/**
 * Pista de carrusel con scroll-snap: se desliza con el gesto y avanza sola cada 6 s. Se detiene con el
 * puntero encima, con el foco de teclado dentro, con la pestaña oculta y, si lo tiene, con su botón.
 * Con movimiento reducido el cambio es instantáneo y el carrusel arranca detenido.
 * La usan la barra de avisos (script de Astro) y el carrusel de anuncios (Preact).
 */
import { prefiereMenosMovimiento } from '@/compartido/movimiento/preferencias';

function diapositivas(pista: HTMLElement): HTMLElement[] {
  return [...pista.children] as HTMLElement[];
}

export function irA(pista: HTMLElement, indice: number) {
  const lista = diapositivas(pista);
  if (!lista.length) return;
  const i = ((indice % lista.length) + lista.length) % lista.length;
  pista.scrollTo({ left: lista[i].offsetLeft - lista[0].offsetLeft, behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth' });
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

export const INTERVALO_CARRUSEL = 6000;

export interface Autoplay {
  /** Reinicia la cuenta (después de que la persona cambia de diapositiva). */
  reiniciar: () => void;
  destruir: () => void;
}

/**
 * Rotación automática. `boton`, si lo hay, alterna pausar y reanudar; `alCambiar(pausado)` actualiza su
 * ícono y etiqueta. Mientras rota, los cambios no se anuncian (aria-live «off», patrón de carrusel de la APG).
 */
export function autoReproducir(
  region: HTMLElement,
  avanzar: () => void,
  boton?: HTMLButtonElement | null,
  alCambiar?: (pausado: boolean) => void,
): Autoplay {
  let pausadoPorPersona = prefiereMenosMovimiento();
  let encima = false;
  let foco = false;
  let temporizador = 0;
  const activo = () => !pausadoPorPersona && !encima && !foco && !document.hidden;
  const programar = () => {
    window.clearInterval(temporizador);
    if (activo()) temporizador = window.setInterval(avanzar, INTERVALO_CARRUSEL);
  };
  const entrar = () => {
    encima = true;
    programar();
  };
  const salir = () => {
    encima = false;
    programar();
  };
  // Solo el foco de teclado: tras tocar o hacer clic, el botón se queda con el foco y no debe impedir reanudar.
  const conFoco = (e: FocusEvent) => {
    foco = (e.target as HTMLElement).matches(':focus-visible');
    programar();
  };
  const sinFoco = (e: FocusEvent) => {
    if (!region.contains(e.relatedTarget as Node | null)) {
      foco = false;
      programar();
    }
  };
  const alternar = () => {
    pausadoPorPersona = !pausadoPorPersona;
    alCambiar?.(pausadoPorPersona);
    programar();
  };
  region.addEventListener('pointerenter', entrar);
  region.addEventListener('pointerleave', salir);
  region.addEventListener('focusin', conFoco);
  region.addEventListener('focusout', sinFoco);
  boton?.addEventListener('click', alternar);
  document.addEventListener('visibilitychange', programar);
  alCambiar?.(pausadoPorPersona);
  programar();
  return {
    reiniciar: programar,
    destruir() {
      window.clearInterval(temporizador);
      region.removeEventListener('pointerenter', entrar);
      region.removeEventListener('pointerleave', salir);
      region.removeEventListener('focusin', conFoco);
      region.removeEventListener('focusout', sinFoco);
      boton?.removeEventListener('click', alternar);
      document.removeEventListener('visibilitychange', programar);
    },
  };
}
