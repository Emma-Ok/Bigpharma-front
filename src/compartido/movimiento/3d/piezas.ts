/**
 * Piezas de las escenas (datos y geometrías, sin renderer): cápsulas de dos colores y tabletas.
 * Las tabletas solo salen en la celebración.
 *
 * El encuadre del hero se define en píxeles de pantalla desde un ancla (el centro de la foto o un borde
 * de la ventana), con una escala fija. Lo leen la escena 3D y scripts/generar-capsulas.mjs: como la
 * imagen estática y el primer cuadro salen de la misma tabla, coinciden en cualquier ancho.
 */
import { Vector2, LatheGeometry } from 'three';

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
/** Distancia de la cámara al plano de la tarjeta (z = 0). */
export const CAMARA_Z = 16;

/** tarjeta: centro de la foto. derecha e izquierda: borde de la ventana, a media altura del canvas. */
export type Ancla = 'tarjeta' | 'derecha' | 'izquierda';

export interface Pieza {
  ancla: Ancla;
  /** Desde el ancla, en píxeles de pantalla (y hacia abajo). */
  x: number;
  y: number;
  z: number;
  escala: number;
  color: number;
  giro: [number, number, number];
  velocidad: [number, number];
  fase: number;
  /** Da la vuelta a la tarjeta, por delante y por detrás, con centro en (x, y): radio en píxeles y ángulo inicial. */
  orbita?: { radio: number; angulo: number };
}

export interface Encuadre {
  pxPorUnidad: number;
  piezas: Pieza[];
  frasco: { x: number; y: number; z: number; escala: number };
}

export type NombreEncuadre = 'celular' | 'escritorio';

const pieza = (
  ancla: Ancla,
  x: number,
  y: number,
  z: number,
  escala: number,
  color: number,
  giro: Pieza['giro'],
  fase: number,
  orbita?: Pieza['orbita'],
): Pieza => ({ ancla, x, y, z, escala, color, giro, fase, orbita, velocidad: [0.05 + (fase % 0.1), 0.04 + (fase % 0.07)] });

/**
 * Primero las grandes, en primer plano y cortadas por el borde; luego las que orbitan y al final las
 * pequeñas del fondo. Si el equipo va lento, la escena se queda con la primera mitad.
 * Al arrancar, ninguna pieza de las ancladas a la tarjeta está por delante de ella: esa capa de la imagen
 * estática va debajo de la tarjeta.
 */
export const ENCUADRES: Record<NombreEncuadre, Encuadre> = {
  escritorio: {
    pxPorUnidad: 50,
    piezas: [
      pieza('derecha', -34, -165, 4.5, 2.1, 0, [0.35, 0.3, -0.75], 0.4),
      pieza('derecha', 6, 20, 3.5, 1.7, 1, [0.25, 0.5, 0.3], 1.9),
      pieza('derecha', -330, -262, 3, 1.5, 2, [0.5, 0.2, 1.15], 3.1),
      pieza('tarjeta', 0, -60, 0, 0.9, 0, [0.4, 0.2, 0.5], 0.8, { radio: 250, angulo: Math.PI + 0.3 }),
      pieza('tarjeta', 0, 10, 0, 0.8, 1, [1.1, 0.3, -0.4], 2.2, { radio: 250, angulo: -0.35 }),
      pieza('tarjeta', 0, -120, 0, 0.7, 2, [0.2, 0.9, 1.2], 4.1, { radio: 250, angulo: Math.PI + 1 }),
      pieza('tarjeta', -228, 60, -3, 0.7, 2, [0.6, 0.4, 0.9], 1.1),
      pieza('tarjeta', -220, 190, -4, 0.6, 0, [1.2, 0.2, -0.6], 2.7),
      pieza('tarjeta', -205, 335, -2.5, 0.75, 1, [0.3, 0.8, 0.5], 3.6),
      pieza('tarjeta', 250, 70, -4.5, 0.6, 0, [0.8, 0.5, 1.3], 0.2),
      pieza('tarjeta', 300, 190, -3, 0.65, 2, [0.4, 1.1, -0.9], 5.2),
      pieza('tarjeta', 70, -165, -5, 0.55, 1, [1, 0.3, 0.2], 4.6),
      pieza('tarjeta', -80, 385, -3.5, 0.6, 2, [0.5, 0.6, 1.4], 5.9),
    ],
    frasco: { x: 215, y: 285, z: -1, escala: 1.15 },
  },
  // Tarjeta horizontal: el ancla es la foto, en su extremo izquierdo. Lo que va en primer plano o en órbita pasa
  // por encima y por debajo de la tarjeta, nunca sobre el nombre o el registro.
  celular: {
    pxPorUnidad: 32,
    piezas: [
      pieza('derecha', -8, -80, 3, 1.3, 0, [0.35, 0.3, -1.1], 0.4),
      pieza('izquierda', 2, -72, 2.5, 1.1, 1, [0.3, 0.4, 1.05], 1.9),
      pieza('tarjeta', 116, 74, 0, 0.7, 2, [0.4, 0.2, 1.2], 0.8, { radio: 170, angulo: Math.PI + 0.2 }),
      pieza('tarjeta', -63, 74, -3, 0.6, 2, [0.6, 0.4, 0.9], 2.7),
      pieza('tarjeta', 150, -80, -3.5, 0.55, 0, [1.2, 0.2, 1.3], 3.6),
    ],
    frasco: { x: 270, y: 66, z: -1, escala: 0.62 },
  },
};

const FONDO_ORBITA = 2.6;
const VELOCIDAD_ORBITA = 0.11;
const DERIVA_PX = 8;

/** Posición de una pieza desde su ancla, en píxeles de pantalla, con la profundidad en unidades de la escena. */
export function ubicar(p: Pieza, segundos: number, avance = 0) {
  if (p.orbita) {
    const a = p.orbita.angulo + segundos * VELOCIDAD_ORBITA + avance;
    return { x: p.x + Math.cos(a) * p.orbita.radio, y: p.y + Math.sin(segundos * 0.35 + p.fase) * 6, z: Math.sin(a) * FONDO_ORBITA };
  }
  return {
    x: p.x + Math.sin(segundos * 0.15 + p.fase) * DERIVA_PX,
    y: p.y + Math.cos(segundos * 0.12 + p.fase) * DERIVA_PX,
    z: p.z,
  };
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

