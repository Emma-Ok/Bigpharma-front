// Genera src/assets/capsulas.svg: la imagen estática del hero (mismas piezas, semilla y cámara), proyectada a 2D
// con three.js para la banda de celular. Va debajo de la tarjeta, en línea, para que nunca sea el elemento LCP.
//   docker compose run --rm web node scripts/generar-capsulas.mjs
import { writeFile } from 'node:fs/promises';
import { Color, Euler, PerspectiveCamera, Vector3 } from 'three';
import { CAMARA, LARGO, MITAD_ALTO, PARES, RADIO, crearPiezas, ubicar, ubicarFrasco } from '../src/compartido/movimiento/3d/piezas.ts';

const ANCHO = 390;
const ALTO = 300;
const TARJETA = { ancho: 240, foto: 136, alto: 236 };
const FONDO = new Color('#D5E5DB');
const NIEBLA = { cerca: CAMARA.z - 2, lejos: CAMARA.z + 16 };

const u = (2 * MITAD_ALTO) / ALTO;
const medidas = {
  mitadAncho: (ANCHO / 2) * u,
  centroX: 0,
  mitadTarjeta: (TARJETA.ancho / 2) * u,
  bajoFoto: (TARJETA.alto / 2 - TARJETA.foto) * u,
};

const camara = new PerspectiveCamera(CAMARA.fov, ANCHO / ALTO, 0.1, 100);
camara.position.set(0, 0, CAMARA.z);
camara.updateMatrixWorld();

const aPantalla = (v) => {
  const p = v.clone().project(camara);
  return { x: ((p.x + 1) / 2) * ANCHO, y: ((1 - p.y) / 2) * ALTO };
};
const r = (n) => Math.round(n * 10) / 10;
const pixeles = (tamano, z) => (tamano * (ALTO / 2)) / (Math.tan(((CAMARA.fov / 2) * Math.PI) / 180) * (CAMARA.z - z));
/** Igual que la niebla lineal de three.js: el color se acerca al fondo con la distancia. */
const conNiebla = (hex, z) => {
  const f = Math.min(1, Math.max(0, (CAMARA.z - z - NIEBLA.cerca) / (NIEBLA.lejos - NIEBLA.cerca)));
  return `#${new Color(hex).lerp(FONDO, f).getHexString()}`;
};

const figuras = crearPiezas(false).map((p) => {
  const { x, y, z } = ubicar(p, medidas, 0);
  const centro = new Vector3(x, y, z);
  const eje = new Vector3(0, 1, 0).applyEuler(new Euler(p.giro.x, p.giro.y, p.giro.z));
  const m = aPantalla(centro);
  const radio = pixeles(RADIO * p.escala, z);
  const a = aPantalla(centro.clone().add(eje.clone().multiplyScalar(LARGO * p.escala)));
  const b = aPantalla(centro.clone().sub(eje.clone().multiplyScalar(LARGO * p.escala)));
  const largo = Math.hypot(a.x - m.x, a.y - m.y) || 1;
  const px = (-(a.y - m.y) / largo) * radio;
  const py = ((a.x - m.x) / largo) * radio;
  const mitad = (fin, color) =>
    `<path d="M${r(m.x + px)} ${r(m.y + py)}L${r(fin.x + px)} ${r(fin.y + py)}L${r(fin.x - px)} ${r(fin.y - py)}L${r(m.x - px)} ${r(m.y - py)}Z" fill="${color}"/>` +
    `<circle cx="${r(fin.x)}" cy="${r(fin.y)}" r="${r(radio)}" fill="${color}"/>`;
  const [colorA, colorB] = PARES[p.color].map((c) => conNiebla(c, z));
  return { z, svg: `<g>${mitad(b, colorB)}${mitad(a, colorA)}</g>` };
});

// Frasco de vidrio ámbar: cuerpo, etiqueta y tapa.
const f = ubicarFrasco(medidas, 0);
const c = aPantalla(new Vector3(f.x, f.y, f.z));
const px = (n) => pixeles(n * 0.82, f.z);
figuras.push({
  z: f.z,
  svg:
    `<rect x="${r(c.x - px(0.76))}" y="${r(c.y - px(0.84))}" width="${r(px(1.52))}" height="${r(px(1.94))}" rx="${r(px(0.22))}" fill="#A8621A"/>` +
    `<rect x="${r(c.x - px(0.76))}" y="${r(c.y - px(-0.05))}" width="${r(px(1.52))}" height="${r(px(0.7))}" fill="#FFFFFF"/>` +
    `<rect x="${r(c.x - px(0.44))}" y="${r(c.y - px(1.3))}" width="${r(px(0.88))}" height="${r(px(0.5))}" rx="${r(px(0.08))}" fill="#133B34"/>`,
});
figuras.sort((x, y) => x.z - y.z);

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
  `${figuras.map((x) => x.svg).join('')}</svg>\n`;
await writeFile('src/assets/capsulas.svg', svg);
console.log(`src/assets/capsulas.svg: ${figuras.length} piezas, ${(svg.length / 1024).toFixed(1)} KB`);
