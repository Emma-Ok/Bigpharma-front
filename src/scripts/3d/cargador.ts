/**
 * Decide si se cargan las escenas 3D y cuándo (docs/MOVIMIENTO-Y-3D.md):
 * - nunca con movimiento reducido, ahorro de datos, poca memoria o sin WebGL (queda la imagen estática);
 * - con la primera interacción (mover el puntero, tocar, desplazar, teclado), en reposo: la carga
 *   inicial queda libre y las piezas llegan volando cuando la persona empieza a usar la página;
 * - cada escena, solo cuando su contenedor está cerca de la pantalla.
 */
type Navegador = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

let webgl: boolean | undefined;

export function puedeCargar3d(): boolean {
  if (typeof window === 'undefined') return false;
  const n = navigator as Navegador;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
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
  if (interactuo) return fn();
  esperandoInteraccion.add(fn);
  if (esperandoInteraccion.size > 1) return;
  const disparar = () => {
    interactuo = true;
    EVENTOS_INTERACCION.forEach((e) => window.removeEventListener(e, disparar));
    const pendientes = [...esperandoInteraccion];
    esperandoInteraccion.clear();
    pendientes.forEach((f) => enReposo(f));
  };
  EVENTOS_INTERACCION.forEach((e) => window.addEventListener(e, disparar, { passive: true, once: true }));
}

/** Corre `fn` cuando conviene cargar 3D en este dispositivo. */
export function cuandoConvenga3d(fn: () => void) {
  if (!puedeCargar3d()) return;
  const tras = () => alPrimeraInteraccion(fn);
  if (document.readyState === 'complete') tras();
  else window.addEventListener('load', tras, { once: true });
}

/** Corre `fn` cuando el elemento está a menos de 300 px de la pantalla. */
function cuandoCerca(elemento: Element, fn: () => void) {
  const observador = new IntersectionObserver(
    (entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        observador.disconnect();
        fn();
      }
    },
    { rootMargin: '300px 0px' },
  );
  observador.observe(elemento);
}

type Escena = (contenedor: HTMLElement) => () => void;
const ESCENAS: Record<string, () => Promise<Escena>> = {
  capsulas: () => import('./capsulas').then((m) => (c: HTMLElement) => m.iniciarCapsulas(c, 'hero')),
  banda: () => import('./capsulas').then((m) => (c: HTMLElement) => m.iniciarCapsulas(c, 'banda')),
  servicios: () => import('./servicios').then((m) => m.iniciarServicios),
};

const activas = new Set<() => void>();

/** Monta las escenas de la página: contenedores con data-escena="capsulas|banda|servicios". */
export function montarEscenasDeLaPagina() {
  document.querySelectorAll<HTMLElement>('[data-escena]').forEach((contenedor) => {
    const cargar = ESCENAS[contenedor.dataset.escena ?? ''];
    if (!cargar) return;
    cuandoConvenga3d(() =>
      cuandoCerca(contenedor, async () => {
      if (!contenedor.isConnected || contenedor.dataset.escenaMontada !== undefined) return;
      contenedor.dataset.escenaMontada = '';
      const iniciar = await cargar();
      if (contenedor.isConnected) activas.add(iniciar(contenedor));
      }),
    );
  });
}

export function desmontarEscenas() {
  activas.forEach((destruir) => destruir());
  activas.clear();
}
