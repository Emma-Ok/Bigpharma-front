// Genera src/assets/capsulas.svg: la imagen estática de la escena 3D (mismas piezas, semilla, cámara y niebla),
// proyectada a 2D con three.js. Es vectorial y va en línea para que nunca sea el elemento LCP.
//   docker compose run --rm web node scripts/generar-capsulas.mjs
import { writeFile } from 'node:fs/promises';
import { Color, Euler, PerspectiveCamera, Vector3 } from 'three';
import { CAMARA, LARGO, PARES, RADIO, RADIO_TABLETA, TABLETAS, crearPiezas } from '../src/scripts/3d/piezas.ts';

const ANCHO = 1440;
const ALTO = 750;
const FONDO = new Color('#D5E5DB');
const NIEBLA = { cerca: CAMARA.z - 2, lejos: CAMARA.z + 16 };

const camara = new PerspectiveCamera(CAMARA.fov, ANCHO / ALTO, 0.1, 100);
camara.position.set(0, 0, CAMARA.z);
camara.updateMatrixWorld();

const aPantalla = (v) => {
  const p = v.clone().project(camara);
  return { x: ((p.x + 1) / 2) * ANCHO, y: ((1 - p.y) / 2) * ALTO };
};
const r = (n) => Math.round(n * 10) / 10;
const pixeles = (tamano, z) =>
  (tamano * (ALTO / 2)) / (Math.tan(((CAMARA.fov / 2) * Math.PI) / 180) * (CAMARA.z - z));
/** Igual que la niebla lineal de three.js: el color se acerca al fondo con la distancia. */
const conNiebla = (hex, z) => {
  const f = Math.min(1, Math.max(0, (CAMARA.z - z - NIEBLA.cerca) / (NIEBLA.lejos - NIEBLA.cerca)));
  return `#${new Color(hex).lerp(FONDO, f).getHexString()}`;
};

const figuras = crearPiezas()
  .map((p) => {
    const centro = new Vector3(p.x + Math.sin(p.fase) * 0.4, p.y + Math.cos(p.fase) * 0.3, p.z);
    const eje = new Vector3(0, 1, 0).applyEuler(new Euler(p.giro.x, p.giro.y, p.giro.z));
    const m = aPantalla(centro);

    if (p.tipo === 'tableta') {
      // Disco visto en perspectiva: elipse achatada en la dirección del eje proyectado.
      const radio = pixeles(RADIO_TABLETA * p.escala, p.z);
      const fin = aPantalla(centro.clone().add(eje));
      const angulo = (Math.atan2(fin.y - m.y, fin.x - m.x) * 180) / Math.PI;
      const achatado = Math.max(0.18, Math.abs(eje.z));
      const color = conNiebla(TABLETAS[p.color], p.z);
      return {
        z: p.z,
        svg: `<ellipse cx="${r(m.x)}" cy="${r(m.y)}" rx="${r(radio * achatado)}" ry="${r(radio)}" transform="rotate(${r(angulo)} ${r(m.x)} ${r(m.y)})" fill="${color}"/>`,
      };
    }

    const radio = pixeles(RADIO * p.escala, p.z);
    const a = aPantalla(centro.clone().add(eje.clone().multiplyScalar(LARGO * p.escala)));
    const b = aPantalla(centro.clone().sub(eje.clone().multiplyScalar(LARGO * p.escala)));
    const largo = Math.hypot(a.x - m.x, a.y - m.y) || 1;
    const px = (-(a.y - m.y) / largo) * radio;
    const py = ((a.x - m.x) / largo) * radio;
    const mitad = (fin, color) =>
      `<path d="M${r(m.x + px)} ${r(m.y + py)}L${r(fin.x + px)} ${r(fin.y + py)}L${r(fin.x - px)} ${r(fin.y - py)}L${r(m.x - px)} ${r(m.y - py)}Z" fill="${color}"/>` +
      `<circle cx="${r(fin.x)}" cy="${r(fin.y)}" r="${r(radio)}" fill="${color}"/>`;
    const [colorA, colorB] = PARES[p.color].map((c) => conNiebla(c, p.z));
    return { z: p.z, svg: `<g>${mitad(b, colorB)}${mitad(a, colorA)}</g>` };
  })
  .sort((x, y) => x.z - y.z);

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
  `${figuras.map((f) => f.svg).join('')}</svg>\n`;
await writeFile('src/assets/capsulas.svg', svg);
console.log(`src/assets/capsulas.svg: ${figuras.length} piezas, ${(svg.length / 1024).toFixed(1)} KB`);
