/** Movimiento que responde a acciones del cliente (docs/MOVIMIENTO-Y-3D.md). */
import { puedeCargar3d } from './3d/cargador';
import { prefiereMenosMovimiento } from './preferencias';

/** Espera a que Preact pinte el estado nuevo (sus renders son asíncronos). */
function siguienteRender(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

/**
 * Aplica un cambio de estado dentro de document.startViewTransition, con «tipos»
 * para que el CSS elija la duración (ficha, cuadricula, carrusel). Sin soporte o con
 * movimiento reducido, aplica el cambio directo.
 */
function transicion(cambio: () => void, tipos: string[]) {
  if (prefiereMenosMovimiento() || !('startViewTransition' in document)) {
    cambio();
    return;
  }
  const update = async () => {
    cambio();
    await siguienteRender();
  };
  try {
    document.startViewTransition({ update, types: tipos });
  } catch {
    // Navegadores con View Transitions pero sin tipos.
    document.startViewTransition(update);
  }
}

/** Abrir la ficha rápida: la imagen crece desde la tarjeta (240 ms). */
export const abrirConTransicion = (cambio: () => void) => transicion(cambio, ['ficha']);

/** Elegir categoría, filtro u orden: las tarjetas que siguen se reubican (220 ms). */
export const cambiarConTransicion = (cambio: () => void) => transicion(cambio, ['cuadricula']);

/** Contador visible en este momento: el del encabezado (escritorio) o el de la barra (celular). */
function contadorVisible(): HTMLElement | null {
  const candidatos = document.querySelectorAll<HTMLElement>('[data-contador-pedido]');
  for (const c of candidatos) {
    const r = c.getBoundingClientRect();
    if (c.offsetParent !== null && r.width > 0) return c;
  }
  return null;
}

/**
 * «Agregar»: un punto de 10 px viaja del botón al contador del pedido (curva de salida, 450 ms)
 * y el contador late (escala 1 → 1,15 → 1). Con movimiento reducido no hay animación.
 */
export function animarAgregado(origen: HTMLElement) {
  if (prefiereMenosMovimiento() || typeof Element.prototype.animate !== 'function') return;
  const destino = contadorVisible();
  if (!destino) return;
  const a = origen.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  const punto = document.createElement('span');
  punto.setAttribute('aria-hidden', 'true');
  Object.assign(punto.style, {
    position: 'fixed',
    left: `${a.left + a.width / 2 - 5}px`,
    top: `${a.top + a.height / 2 - 5}px`,
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--color-bottle)',
    pointerEvents: 'none',
    zIndex: '60',
  });
  document.body.append(punto);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const curva = getComputedStyle(document.documentElement).getPropertyValue('--ease-salida').trim() || 'ease-out';
  const viaje = punto.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(1.1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0.6 },
    ],
    { duration: 450, easing: curva },
  );
  viaje.onfinish = () => {
    punto.remove();
    destino.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], {
      duration: 220,
      easing: curva,
    });
  };
}

/**
 * Celebración 3D (cápsulas que saltan) desde un elemento. Devuelve true si se lanzó; con movimiento
 * reducido, ahorro de datos o sin WebGL no hace nada.
 */
export function celebrarDesde(elemento: Element): boolean {
  if (!puedeCargar3d()) return false;
  const r = elemento.getBoundingClientRect();
  const origen = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  import('@/compartido/movimiento/3d/celebracion').then((m) => m.celebrar(origen)).catch(() => undefined);
  return true;
}
