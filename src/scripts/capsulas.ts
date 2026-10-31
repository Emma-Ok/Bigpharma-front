/**
 * Escena de cápsulas y tabletas del hero (docs/MOVIMIENTO-Y-3D.md, sección 1).
 * Se importa con import() diferido solo en escritorio y con movimiento permitido.
 *
 * - Entrada: las piezas llegan volando desde el fondo, escalonadas.
 * - Profundidad: niebla en el azul claro del hero, luz de contorno cálida.
 * - Puntero: parallax suave de la escena (6° máx.) y las piezas cercanas se apartan y giran.
 * - Scroll: la cámara se aleja y la escena se desvanece en los primeros 400 px.
 */
import {
  Color,
  DirectionalLight,
  Euler,
  Fog,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';

/** Pares de color (mitad A / mitad B) de las cápsulas. */
export const PARES: [string, string][] = [
  ['#1E5AA0', '#FFFFFF'],
  ['#6E9FC4', '#FFFFFF'],
  ['#D9963F', '#FBEBD6'],
];
/** Colores de las tabletas. */
export const TABLETAS = ['#FFFFFF', '#FBEBD6', '#EAF2FB'];

export const CAPSULAS = 22;
export const CANTIDAD_TABLETAS = 10;
export const RADIO = 0.32;
export const LARGO = 0.55;
export const RADIO_TABLETA = 0.42;
export const GROSOR_TABLETA = 0.16;
/** Cámara compartida con la imagen estática (scripts/generar-capsulas.mjs). */
export const CAMARA = { fov: 35, z: 16 };

const PARALLAX_MAX = (6 * Math.PI) / 180;
const FONDO = 0xeaf2fb;
const ENTRADA_MS = 1600;

/** Generador con semilla: la escena (y la imagen estática de respaldo) es siempre la misma. */
function aleatorio(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface Pieza {
  tipo: 'capsula' | 'tableta';
  x: number;
  y: number;
  z: number;
  giro: Euler;
  velocidad: Vector2;
  fase: number;
  /** Índice de color: par de la cápsula o color de la tableta. */
  color: number;
  escala: number;
}

/**
 * Zonas con texto o tapadas (coordenadas de la escena, hero de escritorio): ninguna pieza se dibuja
 * detrás del titular y sus botones, ni detrás de la ficha del profesional y su lista de datos.
 */
function tapaElTexto(x: number, y: number, z: number) {
  // Las piezas lejanas se ven más cerca del centro: las zonas se amplían con la profundidad.
  const k = CAMARA.z / (CAMARA.z - z);
  const xs = x * k;
  const ys = y * k;
  const titular = xs > -9.2 && xs < 0.6 && ys > -3.3 && ys < 3.1;
  const profesional = xs > 1.1 && xs < 8.8 && ys > -5.2 && ys < 4.6;
  return titular || profesional;
}

export function crearPiezas(): Pieza[] {
  const azar = aleatorio(7);
  const crear = (tipo: Pieza['tipo'], i: number): Pieza => {
    let x = 0;
    let y = 0;
    let z = 0;
    do {
      x = (azar() - 0.5) * 22;
      y = (azar() - 0.5) * 10;
      z = -azar() * 8 + 1.5;
    } while (tapaElTexto(x, y, z));
    return {
      tipo,
      x,
      y,
      z,
      giro: new Euler(azar() * Math.PI, azar() * Math.PI, azar() * Math.PI),
      velocidad: new Vector2((azar() - 0.5) * 0.3, (azar() - 0.5) * 0.3),
      fase: azar() * Math.PI * 2,
      color: tipo === 'capsula' ? i % PARES.length : i % TABLETAS.length,
      escala: tipo === 'capsula' ? 0.8 + azar() * 0.55 : 0.75 + azar() * 0.4,
    };
  };
  return [
    ...Array.from({ length: CAPSULAS }, (_, i) => crear('capsula', i)),
    ...Array.from({ length: CANTIDAD_TABLETAS }, (_, i) => crear('tableta', i)),
  ];
}

/** Media cápsula: tramo recto y casquete, girado alrededor del eje Y. La otra mitad es la misma girada 180°. */
function mediaCapsula() {
  const perfil: Vector2[] = [new Vector2(RADIO, 0), new Vector2(RADIO, LARGO)];
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    perfil.push(new Vector2(Math.cos(a) * RADIO, LARGO + Math.sin(a) * RADIO));
  }
  return new LatheGeometry(perfil, 28);
}

/** Tableta redonda con borde biselado y ranura central en la cara superior. */
function tableta() {
  const r = RADIO_TABLETA;
  const h = GROSOR_TABLETA / 2;
  const bisel = 0.07;
  const perfil: Vector2[] = [new Vector2(0, -h)];
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
    perfil.push(new Vector2(r - bisel + Math.cos(a) * bisel, -h + bisel + Math.sin(a) * bisel));
  }
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    perfil.push(new Vector2(r - bisel + Math.cos(a) * bisel, h - bisel + Math.sin(a) * bisel));
  }
  perfil.push(new Vector2(0.05, h), new Vector2(0.03, h - 0.025), new Vector2(0, h - 0.025));
  return new LatheGeometry(perfil, 36);
}

const suavizar = (t: number) => 1 - Math.pow(1 - t, 3);

export function iniciarEscena(contenedor: HTMLElement): () => void {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('tabindex', '-1');
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 600ms ease-out',
  });
  contenedor.append(canvas);

  const escena = new Scene();
  escena.fog = new Fog(FONDO, CAMARA.z - 2, CAMARA.z + 16);
  const camara = new PerspectiveCamera(CAMARA.fov, 1, 0.1, 100);
  camara.position.set(0, 0, CAMARA.z);
  escena.add(new HemisphereLight(0xffffff, 0xc5d3e2, 1.5));
  const clave = new DirectionalLight(0xffffff, 1.7);
  clave.position.set(5, 7, 9);
  const contorno = new DirectionalLight(0xfbebd6, 1.4);
  contorno.position.set(-6, 3, -8);
  const relleno = new DirectionalLight(0x6e9fc4, 0.5);
  relleno.position.set(-4, -6, 6);
  escena.add(clave, contorno, relleno);

  const piezas = crearPiezas();
  const capsulas = piezas.filter((p) => p.tipo === 'capsula');
  const tabletas = piezas.filter((p) => p.tipo === 'tableta');
  const geoCapsula = mediaCapsula();
  const geoTableta = tableta();
  const material = new MeshStandardMaterial({ roughness: 0.4, metalness: 0 });
  const mitadA = new InstancedMesh(geoCapsula, material, capsulas.length);
  const mitadB = new InstancedMesh(geoCapsula, material, capsulas.length);
  const mallaTabletas = new InstancedMesh(geoTableta, material, tabletas.length);
  capsulas.forEach((c, i) => {
    mitadA.setColorAt(i, new Color(PARES[c.color][0]));
    mitadB.setColorAt(i, new Color(PARES[c.color][1]));
  });
  tabletas.forEach((t, i) => mallaTabletas.setColorAt(i, new Color(TABLETAS[t.color])));
  escena.add(mitadA, mitadB, mallaTabletas);

  // Estado por pieza: desplazamiento por el puntero (con resorte) y giro extra.
  const empuje = piezas.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, giro: 0 }));
  const aux = new Object3D();
  const volteo = new Quaternion().setFromEuler(new Euler(Math.PI, 0, 0));
  const objetivo = new Vector2();
  const parallax = new Vector2();
  /** Puntero en coordenadas de la escena (plano z = 0); lejos al inicio. */
  const puntero = new Vector2(1e3, 1e3);
  let conParallax = true;
  let ancho = 1;
  let alto = 1;

  const ubicar = (t: number, ms: number) => {
    let ia = 0;
    let it = 0;
    piezas.forEach((p, i) => {
      // Entrada: cada pieza llega desde el fondo, con 35 ms de diferencia entre una y otra.
      const avance = suavizar(Math.min(1, Math.max(0, (ms - i * 35) / ENTRADA_MS)));
      const e = empuje[i];
      const px = p.x + Math.sin(t * 0.15 + p.fase) * 0.4;
      const py = p.y + Math.cos(t * 0.12 + p.fase) * 0.3;
      // Las piezas cerca del puntero se apartan (resorte amortiguado) y giran más rápido.
      const dx = px - puntero.x;
      const dy = py - puntero.y;
      const d = Math.hypot(dx, dy);
      const radio = 3.2;
      if (d < radio && d > 0.001 && conParallax) {
        const fuerza = Math.pow(1 - d / radio, 2) * 0.06;
        e.vx += (dx / d) * fuerza;
        e.vy += (dy / d) * fuerza;
        e.giro = Math.min(e.giro + fuerza * 4, 3);
      }
      e.vx += -e.x * 0.02;
      e.vy += -e.y * 0.02;
      e.vx *= 0.9;
      e.vy *= 0.9;
      e.x += e.vx;
      e.y += e.vy;
      e.giro *= 0.97;

      const lejos = -40;
      aux.position.set(px + e.x, py + e.y, lejos + (p.z - lejos) * avance);
      const giroEntrada = (1 - avance) * 6;
      aux.rotation.set(
        p.giro.x + t * p.velocidad.x + giroEntrada + e.giro,
        p.giro.y + t * p.velocidad.y + giroEntrada * 0.6,
        p.giro.z + e.giro * 0.5,
      );
      aux.scale.setScalar(p.escala * (0.3 + 0.7 * avance));
      aux.updateMatrix();
      if (p.tipo === 'capsula') {
        mitadA.setMatrixAt(ia, aux.matrix);
        aux.quaternion.multiply(volteo);
        aux.updateMatrix();
        mitadB.setMatrixAt(ia, aux.matrix);
        ia++;
      } else {
        mallaTabletas.setMatrixAt(it, aux.matrix);
        it++;
      }
    });
    mitadA.instanceMatrix.needsUpdate = true;
    mitadB.instanceMatrix.needsUpdate = true;
    mallaTabletas.instanceMatrix.needsUpdate = true;
  };

  const redimensionar = () => {
    const r = contenedor.getBoundingClientRect();
    if (!r.width || !r.height) return;
    ancho = r.width;
    alto = r.height;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  };
  redimensionar();

  // Pausa fuera de pantalla y con la pestaña oculta.
  let visible = true;
  let pestanaVisible = !document.hidden;
  let marco = 0;
  let inicio = -1;
  const muestras: number[] = [];
  let ultimo = performance.now();

  const dibujar = (ahora: number) => {
    marco = 0;
    if (!visible || !pestanaVisible) return;
    if (inicio < 0) inicio = ahora;
    const ms = ahora - inicio;
    const t = ms / 1000;
    // Si el promedio baja de 40 fps durante 2 s: la mitad de piezas y sin parallax ni empuje.
    muestras.push(ahora - ultimo);
    ultimo = ahora;
    if (muestras.length > 120) muestras.shift();
    if (conParallax && ms > ENTRADA_MS + 2000 && muestras.length >= 60) {
      const promedio = muestras.reduce((a, b) => a + b, 0) / muestras.length;
      if (1000 / promedio < 40) {
        conParallax = false;
        mitadA.count = mitadB.count = Math.ceil(capsulas.length / 2);
        mallaTabletas.count = Math.ceil(tabletas.length / 2);
      }
    }
    if (conParallax) parallax.lerp(objetivo, 0.05);
    escena.rotation.set(parallax.y, parallax.x, 0);
    // Scroll: la cámara se aleja un poco y la escena se desvanece en los primeros 400 px.
    const scroll = Math.min(window.scrollY / 400, 1);
    camara.position.z = CAMARA.z + scroll * 5 + Math.sin(t * 0.2) * 0.3;
    ubicar(t, ms);
    renderer.render(escena, camara);
    canvas.style.opacity = String(1 - scroll);
    marco = requestAnimationFrame(dibujar);
  };
  const reanudar = () => {
    if (!marco && visible && pestanaVisible) {
      ultimo = performance.now();
      marco = requestAnimationFrame(dibujar);
    }
  };

  const observador = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    reanudar();
  });
  observador.observe(contenedor);
  const alCambiarPestana = () => {
    pestanaVisible = !document.hidden;
    reanudar();
  };
  document.addEventListener('visibilitychange', alCambiarPestana);
  const mitadVisibleY = Math.tan(((CAMARA.fov / 2) * Math.PI) / 180) * CAMARA.z;
  const alMoverPuntero = (e: PointerEvent) => {
    objetivo.set(
      ((e.clientX / window.innerWidth) * 2 - 1) * PARALLAX_MAX,
      ((e.clientY / window.innerHeight) * 2 - 1) * PARALLAX_MAX,
    );
    const r = contenedor.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    puntero.set(nx * mitadVisibleY * (ancho / alto), ny * mitadVisibleY);
  };
  const alSalir = () => puntero.set(1e3, 1e3);
  window.addEventListener('pointermove', alMoverPuntero, { passive: true });
  document.documentElement.addEventListener('pointerleave', alSalir);
  const redimension = new ResizeObserver(redimensionar);
  redimension.observe(contenedor);

  renderer.render(escena, camara);
  requestAnimationFrame(() => {
    canvas.style.opacity = '1';
    contenedor.dataset.escenaLista = '';
  });
  reanudar();

  return () => {
    cancelAnimationFrame(marco);
    observador.disconnect();
    redimension.disconnect();
    document.removeEventListener('visibilitychange', alCambiarPestana);
    window.removeEventListener('pointermove', alMoverPuntero);
    document.documentElement.removeEventListener('pointerleave', alSalir);
    geoCapsula.dispose();
    geoTableta.dispose();
    material.dispose();
    mitadA.dispose();
    mitadB.dispose();
    mallaTabletas.dispose();
    renderer.dispose();
    canvas.remove();
    delete contenedor.dataset.escenaLista;
  };
}
