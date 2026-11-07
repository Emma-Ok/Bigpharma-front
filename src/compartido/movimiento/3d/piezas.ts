/**
 * Piezas de las escenas (datos y geometrías, sin renderer): cápsulas de dos colores y tabletas.
 * Las tabletas solo salen en la celebración. Lo usan las escenas 3D y scripts/generar-capsulas.mjs
 * (imagen estática), por eso solo importa three.
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

/** Geometría del escenario en unidades de la escena, en el plano z = 0 (la tarjeta está ahí). */
export interface Medidas {
  /** Mitad del ancho visible. */
  mitadAncho: number;
  /** Centro y mitad del ancho de la tarjeta. */
  centroX: number;
  mitadTarjeta: number;
  /** Borde inferior de la foto: por debajo está el texto, que ninguna pieza puede tapar. */
  bajoFoto: number;
}

export interface Pieza {
  /** orbita: da la vuelta a la tarjeta, por delante y por detrás de la foto. lateral: flota a un costado, detrás. */
  tipo: 'orbita' | 'lateral';
  /** Posición entre 0 y 1 dentro de la franja que le toca. */
  fx: number;
  fy: number;
  lado: 1 | -1;
  fase: number;
  giro: Euler;
  velocidad: Vector2;
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

/** Cápsulas del hero: 13 en escritorio y 5 en celular; con el frasco son ~14 y ~6 objetos. */
export function crearPiezas(ligero: boolean): Pieza[] {
  const azar = aleatorio(7);
  const orbitas = ligero ? 3 : 7;
  const total = ligero ? 5 : 13;
  return Array.from({ length: total }, (_, i) => {
    const orbita = i < orbitas;
    return {
      tipo: orbita ? 'orbita' : 'lateral',
      fx: azar(),
      fy: orbita ? (i + 0.5) / orbitas : ((i - orbitas + azar() * 0.6) / (total - orbitas)) * 0.9,
      lado: i % 2 ? 1 : -1,
      fase: orbita ? (i / orbitas) * Math.PI * 2 : azar() * Math.PI * 2,
      giro: new Euler(azar() * Math.PI, azar() * Math.PI, azar() * Math.PI),
      velocidad: new Vector2((azar() - 0.5) * 0.3, (azar() - 0.5) * 0.3),
      color: i % PARES.length,
      escala: 0.75 + azar() * 0.4,
    };
  });
}

const FONDO_ORBITA = 2.6;
const VELOCIDAD_ORBITA = 0.11;

/**
 * Posición de una pieza. Las órbitas solo pasan a la altura de la foto o por encima, nunca del texto;
 * las laterales van detrás de la tarjeta (z < 0), que las tapa si se acercan.
 */
export function ubicar(p: Pieza, m: Medidas, segundos: number, avance = 0) {
  if (p.tipo === 'orbita') {
    const a = p.fase + segundos * VELOCIDAD_ORBITA + avance;
    const radio = Math.min(m.mitadAncho * 0.92, m.mitadTarjeta + 1.6);
    const piso = m.bajoFoto + 1.1;
    return {
      x: m.centroX + Math.cos(a) * radio,
      y: piso + p.fy * (MITAD_ALTO - piso) + Math.sin(segundos * 0.35 + p.fase) * 0.12,
      z: Math.sin(a) * FONDO_ORBITA,
    };
  }
  const cerca = m.mitadTarjeta + 0.5;
  const lejos = Math.max(cerca, Math.min(m.mitadAncho - 0.5, cerca + 3.5));
  return {
    x: m.centroX + p.lado * (cerca + p.fx * (lejos - cerca)) + Math.sin(segundos * 0.15 + p.fase) * 0.2,
    y: MITAD_ALTO * (0.8 - 1.7 * p.fy) + Math.cos(segundos * 0.12 + p.fase) * 0.2,
    z: -1.2 - p.fx * 1.6,
  };
}

/** Frasco: abajo, a un costado, medio escondido detrás de la tarjeta. */
export function ubicarFrasco(m: Medidas, segundos: number) {
  return {
    x: m.centroX + m.mitadTarjeta + 0.55,
    y: -MITAD_ALTO * 0.5 + Math.sin(segundos * 0.3) * 0.12,
    z: -0.9,
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

