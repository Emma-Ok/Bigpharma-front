/**
 * Piezas de las escenas (datos y geometrías, sin renderer): cápsulas de dos colores y tabletas.
 * Lo usan las escenas 3D y scripts/generar-capsulas.mjs (imagen estática), por eso solo importa three.
 */
import { Euler, LatheGeometry, Vector2 } from 'three';

export const PARES: [string, string][] = [
  ['#133B34', '#FFFFFF'],
  ['#133B34', '#D5E5DB'],
  ['#4A5A55', '#F3F5F1'],
];
export const TABLETAS = ['#FFFFFF', '#F3F5F1', '#D5E5DB'];
export const RADIO = 0.32;
export const LARGO = 0.55;
export const RADIO_TABLETA = 0.42;
export const GROSOR_TABLETA = 0.16;
/** Cámara compartida con la imagen estática (scripts/generar-capsulas.mjs). */
export const CAMARA = { fov: 35, z: 16 };
export const MITAD_ALTO = Math.tan(((CAMARA.fov / 2) * Math.PI) / 180) * CAMARA.z;

export type Variante = 'hero' | 'banda';
type Distribucion = 'escritorio' | 'celular';

export interface Pieza {
  tipo: 'capsula' | 'tableta';
  x: number;
  y: number;
  z: number;
  giro: Euler;
  velocidad: Vector2;
  fase: number;
  color: number;
  escala: number;
}

function aleatorio(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** ¿La posición (fracción de pantalla, -1 a 1) cae sobre texto o sobre algo opaco? */
function ocupada(variante: Variante, d: Distribucion, fx: number, fy: number): boolean {
  if (variante === 'hero' && d === 'escritorio') {
    const titular = fx > -0.95 && fx < 0.07 && fy > -0.66 && fy < 0.62;
    const profesional = fx > 0.11 && fx < 0.91 && fy > -1.05 && fy < 0.92;
    return titular || profesional;
  }
  if (d === 'celular') return variante === 'banda' && fx < 0;
  return fx < 0.12;
}

/** Fracción del ancho (desde el centro) donde pueden quedar las piezas en celular. */
const BORDES_CELULAR: Record<Variante, [number, number]> = { hero: [1.06, 1.3], banda: [0.86, 1.25] };

const CANTIDADES: Record<Variante, Record<Distribucion, [number, number]>> = {
  hero: { escritorio: [22, 10], celular: [10, 6] },
  banda: { escritorio: [10, 5], celular: [5, 3] },
};

/** `mitadAlto`: mitad del alto visible en el plano z = 0 (menor cuando la cámara hace zoom en contenedores bajos). */
export function crearPiezas(variante: Variante = 'hero', aspecto = 1440 / 750, mitadAlto = MITAD_ALTO): Pieza[] {
  const d: Distribucion = aspecto < 1 ? 'celular' : 'escritorio';
  const [nCapsulas, nTabletas] = CANTIDADES[variante][d];
  const azar = aleatorio(variante === 'hero' ? 7 : 11);
  const mitadAncho = mitadAlto * aspecto;
  const crear = (tipo: Pieza['tipo'], i: number): Pieza => {
    let x = 0;
    let y = 0;
    let z = 0;
    let intentos = 0;
    do {
      z = -azar() * 8 + 1.5;
      // Las piezas lejanas se ven más cerca del centro: se reparten en el área visible a su profundidad.
      const k = (CAMARA.z - z) / CAMARA.z;
      // En celular el texto ocupa todo el ancho: las piezas solo asoman por fuera de los márgenes.
      const borde = BORDES_CELULAR[variante];
      x =
        d === 'celular'
          ? (azar() < 0.5 ? -1 : 1) * (borde[0] + azar() * (borde[1] - borde[0])) * mitadAncho * k
          : (azar() * 2 - 1) * mitadAncho * 1.12 * k;
      y = (azar() * 2 - 1) * mitadAlto * k;
      intentos++;
    } while (ocupada(variante, d, x / (mitadAncho * ((CAMARA.z - z) / CAMARA.z)), y / (mitadAlto * ((CAMARA.z - z) / CAMARA.z))) && intentos < 200);
    return {
      tipo,
      x,
      y,
      z,
      giro: new Euler(azar() * Math.PI, azar() * Math.PI, azar() * Math.PI),
      velocidad: new Vector2((azar() - 0.5) * 0.3, (azar() - 0.5) * 0.3),
      fase: azar() * Math.PI * 2,
      color: tipo === 'capsula' ? i % PARES.length : i % TABLETAS.length,
      escala: (tipo === 'capsula' ? 0.8 + azar() * 0.55 : 0.75 + azar() * 0.4) * (d === 'celular' ? 0.85 : 1),
    };
  };
  return [
    ...Array.from({ length: nCapsulas }, (_, i) => crear('capsula', i)),
    ...Array.from({ length: nTabletas }, (_, i) => crear('tableta', i)),
  ];
}

export function geometriaMediaCapsula(segmentos = 24) {
  const perfil: Vector2[] = [new Vector2(RADIO, 0), new Vector2(RADIO, LARGO)];
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    perfil.push(new Vector2(Math.cos(a) * RADIO, LARGO + Math.sin(a) * RADIO));
  }
  return new LatheGeometry(perfil, segmentos);
}

export function geometriaTableta(segmentos = 28) {
  const r = RADIO_TABLETA;
  const h = GROSOR_TABLETA / 2;
  const bisel = 0.07;
  const perfil: Vector2[] = [new Vector2(0, -h)];
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * (Math.PI / 2);
    perfil.push(new Vector2(r - bisel + Math.cos(a) * bisel, -h + bisel + Math.sin(a) * bisel));
  }
  for (let i = 0; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    perfil.push(new Vector2(r - bisel + Math.cos(a) * bisel, h - bisel + Math.sin(a) * bisel));
  }
  perfil.push(new Vector2(0.05, h), new Vector2(0.03, h - 0.025), new Vector2(0, h - 0.025));
  return new LatheGeometry(perfil, segmentos);
}

