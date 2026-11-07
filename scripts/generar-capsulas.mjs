// Genera la imagen estática del hero en src/assets/hero-*.svg, desde la misma tabla que la escena 3D (piezas.ts):
// una capa por encuadre y por ancla, en píxeles desde el ancla. Va en línea para que nunca sea el elemento LCP.
//   docker compose run --rm web node scripts/generar-capsulas.mjs
import { writeFile } from 'node:fs/promises';
import { Color, Euler, Vector3 } from 'three';
import { CAMARA_Z, ENCUADRES, LARGO, PARES, RADIO, RADIO_TABLETA, TABLETAS_HERO, ubicar } from '../src/compartido/movimiento/3d/piezas.ts';

const FONDO = new Color('#F3F5F1');
const NIEBLA = { cerca: CAMARA_Z - 2, lejos: CAMARA_Z + 16 };

const r = (n) => Math.round(n * 10) / 10;
/** Igual que la niebla lineal de three.js: el color se acerca al fondo con la distancia. */
const conNiebla = (hex, z) => {
  const f = Math.min(1, Math.max(0, (CAMARA_Z - z - NIEBLA.cerca) / (NIEBLA.lejos - NIEBLA.cerca)));
  return `#${new Color(hex).lerp(FONDO, f).getHexString()}`;
};

let degradados = 0;

function capsula(p, escalaPx) {
  const { x, y, z } = ubicar(p, 0);
  const px = escalaPx * (CAMARA_Z / (CAMARA_Z - z));
  const eje = new Vector3(0, 1, 0).applyEuler(new Euler(...p.giro));
  // Extremo de cada mitad, proyectado: y de pantalla hacia abajo.
  const fin = (signo) => ({ x: x + signo * eje.x * LARGO * p.escala * px, y: y - signo * eje.y * LARGO * p.escala * px });
  const a = fin(1);
  const b = fin(-1);
  const radio = RADIO * p.escala * px;
  const largo = Math.hypot(a.x - x, a.y - y) || 1;
  const ox = (-(a.y - y) / largo) * radio;
  const oy = ((a.x - x) / largo) * radio;
  const mitad = (f, color) =>
    `<path d="M${r(x + ox)} ${r(y + oy)}L${r(f.x + ox)} ${r(f.y + oy)}L${r(f.x - ox)} ${r(f.y - oy)}L${r(x - ox)} ${r(y - oy)}Z" fill="${color}"/>` +
    `<circle cx="${r(f.x)}" cy="${r(f.y)}" r="${r(radio)}" fill="${color}"/>`;
  const [colorA, colorB] = PARES[p.color].map((c) => conNiebla(c, z));
  // Sombra de lado a lado, como la luz de la escena: sin ella, la mitad clara se pierde sobre el fondo.
  const id = `s${++degradados}`;
  const sombra =
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r(x + ox)}" y1="${r(y + oy)}" x2="${r(x - ox)}" y2="${r(y - oy)}">` +
    `<stop offset="0" stop-color="#1C2623" stop-opacity=".26"/><stop offset=".6" stop-color="#1C2623" stop-opacity=".05"/></linearGradient>` +
    `<path d="M${r(a.x + ox)} ${r(a.y + oy)}L${r(b.x + ox)} ${r(b.y + oy)}A${r(radio)} ${r(radio)} 0 0 ${ox * (a.y - b.y) - oy * (a.x - b.x) > 0 ? 0 : 1} ${r(b.x - ox)} ${r(b.y - oy)}L${r(a.x - ox)} ${r(a.y - oy)}A${r(radio)} ${r(radio)} 0 0 ${ox * (a.y - b.y) - oy * (a.x - b.x) > 0 ? 0 : 1} ${r(a.x + ox)} ${r(a.y + oy)}Z" fill="url(#${id})"/>`;
  return { z, svg: `<g>${mitad(b, colorB)}${mitad(a, colorA)}${sombra}</g>` };
}

/** Pastilla vista en perspectiva: elipse achatada en la dirección de su eje, con la misma sombra que las cápsulas. */
function tableta(p, escalaPx) {
  const { x, y, z } = ubicar(p, 0);
  const px = escalaPx * (CAMARA_Z / (CAMARA_Z - z));
  const eje = new Vector3(0, 1, 0).applyEuler(new Euler(...p.giro));
  const radio = RADIO_TABLETA * p.escala * px;
  const angulo = (Math.atan2(-eje.y, eje.x) * 180) / Math.PI;
  const achatado = Math.max(0.2, Math.abs(eje.z));
  const id = `s${++degradados}`;
  const color = conNiebla(TABLETAS_HERO[p.color], z);
  const forma = (relleno) =>
    `<ellipse cx="${r(x)}" cy="${r(y)}" rx="${r(radio * achatado)}" ry="${r(radio)}" transform="rotate(${r(angulo)} ${r(x)} ${r(y)})" fill="${relleno}"/>`;
  return {
    z,
    svg:
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r(x - radio)}" y1="${r(y - radio)}" x2="${r(x + radio)}" y2="${r(y + radio)}">` +
      `<stop offset=".4" stop-color="#1C2623" stop-opacity=".04"/><stop offset="1" stop-color="#1C2623" stop-opacity=".24"/></linearGradient>` +
      `<g>${forma(color)}${forma(`url(#${id})`)}</g>`,
  };
}

/** Frasco de vidrio ámbar: cuerpo, contenido, etiqueta y tapa. */
function frasco(f, escalaPx) {
  const k = f.escala * escalaPx * (CAMARA_Z / (CAMARA_Z - f.z));
  const n = (v) => r(v * k);
  return {
    z: f.z,
    svg:
      `<g transform="translate(${r(f.x)} ${r(f.y)}) rotate(6.9)">` +
      `<path d="M${n(-0.38)} ${n(-1)}H${n(0.38)}V${n(-0.84)}Q${n(0.76)} ${n(-0.72)} ${n(0.76)} ${n(-0.42)}V${n(1)}L${n(0.68)} ${n(1.1)}H${n(-0.68)}L${n(-0.76)} ${n(1)}V${n(-0.42)}Q${n(-0.76)} ${n(-0.72)} ${n(-0.38)} ${n(-0.84)}Z" fill="#A9682A"/>` +
      `<rect x="${n(-0.76)}" y="${n(-0.25)}" width="${n(1.52)}" height="${n(1.35)}" rx="${n(0.1)}" fill="#8A4E12"/>` +
      `<rect x="${n(-0.77)}" y="${n(-0.05)}" width="${n(1.54)}" height="${n(0.7)}" fill="#FFFFFF"/>` +
      `<rect x="${n(-0.44)}" y="${n(-1.35)}" width="${n(0.88)}" height="${n(0.38)}" rx="${n(0.06)}" fill="#133B34"/>` +
      `</g>`,
  };
}

for (const [nombre, encuadre] of Object.entries(ENCUADRES)) {
  const anclas = Object.groupBy(encuadre.piezas, (p) => p.ancla);
  for (const [ancla, piezas] of Object.entries(anclas)) {
    const figuras = piezas.map((p) => (p.tipo === 'tableta' ? tableta : capsula)(p, encuadre.pxPorUnidad));
    if (ancla === 'tarjeta') figuras.push(frasco(encuadre.frasco, encuadre.pxPorUnidad));
    figuras.sort((x, y) => x.z - y.z);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" overflow="visible" aria-hidden="true" focusable="false" style="overflow:visible;display:block">` +
      `${figuras.map((x) => x.svg).join('')}</svg>\n`;
    const archivo = `src/assets/hero-${nombre}-${ancla}.svg`;
    await writeFile(archivo, svg);
    console.log(`${archivo}: ${figuras.length} figuras, ${(svg.length / 1024).toFixed(1)} KB`);
  }
}
