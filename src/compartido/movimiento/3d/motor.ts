/**
 * Motor común de las escenas 3D: renderer transparente, cámara, luces de la marca, pausa fuera de
 * pantalla y con la pestaña oculta, ajuste de tamaño, control de fps y limpieza al salir.
 */
import {
  DirectionalLight,
  Fog,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type Object3D,
} from 'three';

export interface OpcionesMotor {
  /** Celular o equipo modesto: sin antialias y con menos potencia. */
  ligero: boolean;
  fov?: number;
  distancia?: number;
  /** Color de la niebla (el fondo de la sección); sin niebla si no se indica. */
  niebla?: number;
  /** El lienzo recibe eventos del puntero (por defecto no). */
  interactivo?: boolean;
  /** El lienzo ocupa la ventana (celebración) en vez del contenedor. */
  pantallaCompleta?: boolean;
}

export interface Motor {
  escena: Scene;
  camara: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  ancho: () => number;
  alto: () => number;
  /** Corre `fn(ms, dt)` en cada cuadro visible. Devuelve una promesa que se cumple al primer cuadro. */
  animar: (fn: (ms: number, dt: number) => void) => Promise<void>;
  /** Se llama una vez si el promedio baja de 40 fps durante 2 s. */
  alIrLento: (fn: () => void) => void;
  destruir: () => void;
  agregar: (...objetos: Object3D[]) => void;
}

export function crearMotor(contenedor: HTMLElement, o: OpcionesMotor): Motor {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: !o.ligero,
    powerPreference: o.ligero ? 'low-power' : 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('tabindex', '-1');
  Object.assign(canvas.style, {
    position: o.pantallaCompleta ? 'fixed' : 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: o.interactivo ? 'auto' : 'none',
    opacity: '0',
    transition: 'opacity 300ms ease-out',
    zIndex: o.pantallaCompleta ? '70' : '',
  });
  contenedor.append(canvas);

  const escena = new Scene();
  if (o.niebla !== undefined) escena.fog = new Fog(o.niebla, (o.distancia ?? 16) - 2, (o.distancia ?? 16) + 16);
  const camara = new PerspectiveCamera(o.fov ?? 35, 1, 0.1, 100);
  camara.position.set(0, 0, o.distancia ?? 16);
  const clave = new DirectionalLight(0xffffff, 1.7);
  clave.position.set(5, 7, 9);
  const contorno = new DirectionalLight(0xf3f5f1, 1.4);
  contorno.position.set(-6, 3, -8);
  const relleno = new DirectionalLight(0xd5e5db, 0.5);
  relleno.position.set(-4, -6, 6);
  escena.add(new HemisphereLight(0xffffff, 0xd5e5db, 1.5), clave, contorno, relleno);

  let ancho = 1;
  let alto = 1;
  const redimensionar = () => {
    const r = o.pantallaCompleta
      ? { width: window.innerWidth, height: window.innerHeight }
      : contenedor.getBoundingClientRect();
    if (!r.width || !r.height) return;
    ancho = r.width;
    alto = r.height;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  };
  redimensionar();
  const redimension = new ResizeObserver(redimensionar);
  redimension.observe(o.pantallaCompleta ? document.documentElement : contenedor);

  let visible = true;
  let pestanaVisible = !document.hidden;
  let marco = 0;
  let inicio = -1;
  let ultimo = 0;
  let paso: ((ms: number, dt: number) => void) | null = null;
  let lento: (() => void) | null = null;
  let avisoLento = false;
  let primero = true;
  const muestras: number[] = [];
  let primerCuadro: () => void = () => {};
  const listo = new Promise<void>((r) => (primerCuadro = r));

  const dibujar = (ahora: number) => {
    marco = 0;
    if (!visible || !pestanaVisible || !paso) return;
    if (inicio < 0) {
      inicio = ahora;
      ultimo = ahora;
    }
    const dt = Math.min(ahora - ultimo, 100);
    ultimo = ahora;
    muestras.push(dt);
    if (muestras.length > 120) muestras.shift();
    const ms = ahora - inicio;
    if (!avisoLento && lento && ms > 3500 && muestras.length >= 60) {
      const promedio = muestras.reduce((a, b) => a + b, 0) / muestras.length;
      if (1000 / promedio < 40) {
        avisoLento = true;
        lento();
      }
    }
    paso(ms, dt);
    renderer.render(escena, camara);
    if (primero) {
      primero = false;
      if (canvas.style.opacity === '0') canvas.style.opacity = '1';
      contenedor.dataset.escenaLista = '';
      primerCuadro();
    }
    marco = requestAnimationFrame(dibujar);
  };
  const reanudar = () => {
    if (!marco && visible && pestanaVisible && paso) {
      ultimo = performance.now();
      marco = requestAnimationFrame(dibujar);
    }
  };

  const observador = new IntersectionObserver(([e]) => {
    visible = o.pantallaCompleta || e.isIntersecting;
    reanudar();
  });
  observador.observe(contenedor);
  const alCambiarPestana = () => {
    pestanaVisible = !document.hidden;
    reanudar();
  };
  document.addEventListener('visibilitychange', alCambiarPestana);

  return {
    escena,
    camara,
    canvas,
    ancho: () => ancho,
    alto: () => alto,
    agregar: (...objetos) => escena.add(...objetos),
    animar(fn) {
      paso = fn;
      // Compila los shaders sin bloquear el hilo principal y luego empieza a dibujar.
      renderer
        .compileAsync(escena, camara)
        .catch(() => undefined)
        .then(reanudar);
      return listo;
    },
    alIrLento(fn) {
      lento = fn;
    },
    destruir() {
      cancelAnimationFrame(marco);
      paso = null;
      observador.disconnect();
      redimension.disconnect();
      document.removeEventListener('visibilitychange', alCambiarPestana);
      escena.traverse((obj) => {
        const malla = obj as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } | { dispose(): void }[] };
        malla.geometry?.dispose();
        const m = malla.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      renderer.dispose();
      canvas.remove();
      delete contenedor.dataset.escenaLista;
    },
  };
}

/** Pantalla chica o puntero táctil: escenas más livianas. */
export function esLigero(): boolean {
  return window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
}
