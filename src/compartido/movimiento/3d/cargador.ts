/**
 * Decide si se cargan las escenas 3D y cuándo (docs/MOVIMIENTO-Y-3D.md):
 * - nunca con movimiento reducido, ahorro de datos, poca memoria o sin WebGL (queda la imagen estática);
 * - después de load, con la primera interacción (mover el puntero, tocar, desplazar, teclado) y en
 *   reposo. Cargarla apenas termina load da 77 en Lighthouse móvil (TBT de 1070 ms), por debajo del 90
 *   que pide el proyecto; mientras tanto se ve la imagen estática.
 */
import { prefiereMenosMovimiento } from '@/compartido/movimiento/preferencias';

type Navegador = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

let webgl: boolean | undefined;

export function puedeCargar3d(): boolean {
  if (typeof window === 'undefined') return false;
  const n = navigator as Navegador;
  if (prefiereMenosMovimiento()) return false;
  if (n.connection?.saveData === true) return false;
  if (typeof n.deviceMemory === 'number' && n.deviceMemory < 2) return false;
  if (webgl === undefined) {
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

function enReposo(fn: () => void) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 2000 });
  else setTimeout(fn, 200);
}

const EVENTOS_INTERACCION = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'keydown', 'wheel'] as const;
let interactuo = false;
const esperandoInteraccion = new Set<() => void>();

function alPrimeraInteraccion(fn: () => void) {
  if (interactuo) return enReposo(fn);
  esperandoInteraccion.add(fn);
  if (esperandoInteraccion.size > 1) return;
  const disparar = () => {
    interactuo = true;
    EVENTOS_INTERACCION.forEach((e) => window.removeEventListener(e, disparar));
    const pendientes = [...esperandoInteraccion];
    esperandoInteraccion.clear();
    pendientes.forEach(enReposo);
  };
  EVENTOS_INTERACCION.forEach((e) => window.addEventListener(e, disparar, { passive: true, once: true }));
}

/** Corre `fn` cuando conviene cargar 3D en este dispositivo. */
export function cuandoConvenga3d(fn: () => void) {
  if (!puedeCargar3d()) return;
  if (document.readyState === 'complete') alPrimeraInteraccion(fn);
  else window.addEventListener('load', () => alPrimeraInteraccion(fn), { once: true });
}
