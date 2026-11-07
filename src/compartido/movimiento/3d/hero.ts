/**
 * Escena del hero (docs/MOVIMIENTO-Y-3D.md, sección 1): cápsulas y un frasco de vidrio ámbar alrededor
 * de la tarjeta del profesional. El canvas va encima de la tarjeta y un plano invisible del tamaño de
 * la tarjeta escribe solo profundidad: lo que pasa por detrás queda tapado y lo que pasa por delante
 * se ve sobre la foto. Así basta un contexto WebGL.
 * Parallax: con el puntero en escritorio y con el scroll en celular.
 */
import {
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Euler,
  Object3D,
  Quaternion,
  Shape,
  ShapeGeometry,
  Vector2,
} from 'three';
import { crearMotor, esLigero, FONDO_CELADON } from './motor';
import {
  CAMARA,
  crearPiezas,
  geometriaMediaCapsula,
  MITAD_ALTO,
  PARES,
  ubicar,
  ubicarFrasco,
  type Medidas,
} from './piezas';

const PARALLAX_MAX = (6 * Math.PI) / 180;
const ENTRADA_MS = 1200;
const AMBAR = 0xa8621a;
const AMBAR_OSCURO = 0x8a4e12;
const BOTTLE = 0x133b34;
const RADIO_TARJETA_PX = 20;

const suavizar = (t: number) => 1 - Math.pow(1 - t, 3);

function crearFrasco(segmentos: number): Group {
  const perfil = [
    new Vector2(0, -1.1),
    new Vector2(0.68, -1.1),
    new Vector2(0.76, -1),
    new Vector2(0.76, 0.5),
    new Vector2(0.62, 0.74),
    new Vector2(0.38, 0.84),
    new Vector2(0.38, 1),
  ];
  const frasco = new Group();
  const contenido = new Mesh(
    new CylinderGeometry(0.66, 0.66, 1.3, segmentos),
    new MeshStandardMaterial({ color: AMBAR_OSCURO, roughness: 0.5, fog: false }),
  );
  contenido.position.y = -0.4;
  const vidrio = new Mesh(
    new LatheGeometry(perfil, segmentos),
    new MeshPhysicalMaterial({ color: AMBAR, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.82, depthWrite: false, fog: false }),
  );
  const etiqueta = new Mesh(
    new CylinderGeometry(0.77, 0.77, 0.7, segmentos, 1, true),
    new MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  );
  etiqueta.position.y = -0.3;
  const tapa = new Mesh(new CylinderGeometry(0.44, 0.44, 0.38, segmentos), new MeshStandardMaterial({ color: BOTTLE, roughness: 0.4 }));
  tapa.position.y = 1.16;
  frasco.add(contenido, vidrio, etiqueta, tapa);
  return frasco;
}

function formaTarjeta(ancho: number, alto: number, radio: number): Shape {
  const x = -ancho / 2;
  const y = -alto / 2;
  const s = new Shape();
  s.moveTo(x + radio, y);
  s.lineTo(x + ancho - radio, y);
  s.absarc(x + ancho - radio, y + radio, radio, -Math.PI / 2, 0, false);
  s.lineTo(x + ancho, y + alto - radio);
  s.absarc(x + ancho - radio, y + alto - radio, radio, 0, Math.PI / 2, false);
  s.lineTo(x + radio, y + alto);
  s.absarc(x + radio, y + alto - radio, radio, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + radio);
  s.absarc(x + radio, y + radio, radio, Math.PI, Math.PI * 1.5, false);
  return s;
}

export function iniciarHero(contenedor: HTMLElement): () => void {
  const escenario = contenedor.closest<HTMLElement>('[data-escenario]');
  const tarjeta = escenario?.querySelector<HTMLElement>('[data-tarjeta-hero]');
  const foto = escenario?.querySelector<HTMLElement>('[data-foto-hero]');
  if (!tarjeta || !foto) return () => {};

  const ligero = esLigero();
  const motor = crearMotor(contenedor, { ligero, fov: CAMARA.fov, distancia: CAMARA.z, niebla: FONDO_CELADON });
  const piezas = crearPiezas(ligero);
  const seg = ligero ? 16 : 24;
  const material = new MeshStandardMaterial({ roughness: 0.4, metalness: 0 });
  const mitadA = new InstancedMesh(geometriaMediaCapsula(seg), material, piezas.length);
  const mitadB = new InstancedMesh(mitadA.geometry, material, piezas.length);
  piezas.forEach((p, i) => {
    mitadA.setColorAt(i, new Color(PARES[p.color][0]));
    mitadB.setColorAt(i, new Color(PARES[p.color][1]));
  });
  const frasco = crearFrasco(ligero ? 20 : 32);
  frasco.scale.setScalar(ligero ? 0.82 : 1.15);
  const grupo = new Group();
  grupo.add(mitadA, mitadB, frasco);

  const oclusor = new Mesh(new ShapeGeometry(new Shape()), new MeshBasicMaterial({ colorWrite: false }));
  oclusor.renderOrder = -1;
  motor.agregar(oclusor, grupo);

  const medidas: Medidas = { mitadAncho: 1, centroX: 0, mitadTarjeta: 1, bajoFoto: 0 };
  const medir = () => {
    const c = contenedor.getBoundingClientRect();
    const t = tarjeta.getBoundingClientRect();
    if (!c.height || !t.height) return;
    const u = (2 * MITAD_ALTO) / c.height;
    const centroY = (c.top + c.height / 2 - (t.top + t.height / 2)) * u;
    medidas.mitadAncho = (c.width / 2) * u;
    medidas.centroX = (t.left + t.width / 2 - c.left - c.width / 2) * u;
    medidas.mitadTarjeta = (t.width / 2) * u;
    medidas.bajoFoto = (c.top + c.height / 2 - foto.getBoundingClientRect().bottom) * u;
    oclusor.geometry.dispose();
    oclusor.geometry = new ShapeGeometry(formaTarjeta(t.width * u, t.height * u, RADIO_TARJETA_PX * u), 8);
    oclusor.position.set(medidas.centroX, centroY, 0);
  };
  medir();
  const redimension = new ResizeObserver(medir);
  redimension.observe(contenedor);

  const aux = new Object3D();
  const volteo = new Quaternion().setFromEuler(new Euler(Math.PI, 0, 0));
  const objetivo = new Vector2();
  const parallax = new Vector2();
  let conParallax = true;
  motor.alIrLento(() => {
    conParallax = false;
    objetivo.set(0, 0);
    mitadA.count = mitadB.count = Math.ceil(piezas.length / 2);
  });

  const alMoverPuntero = (e: PointerEvent) => {
    if (!conParallax) return;
    objetivo.set(((e.clientX / window.innerWidth) * 2 - 1) * PARALLAX_MAX, ((e.clientY / window.innerHeight) * 2 - 1) * PARALLAX_MAX);
  };
  if (!ligero) window.addEventListener('pointermove', alMoverPuntero, { passive: true });

  motor.animar((ms) => {
    const t = ms / 1000;
    let avance = 0;
    if (ligero && conParallax) {
      const r = contenedor.getBoundingClientRect();
      const desplazado = Math.min(Math.max(0, -r.top / r.height), 1);
      objetivo.set(0, desplazado * PARALLAX_MAX * 2);
      grupo.position.y = desplazado * 1.2;
      avance = desplazado * 1.4;
    }
    parallax.lerp(objetivo, 0.06);
    grupo.rotation.set(parallax.y, parallax.x, 0);

    piezas.forEach((p, i) => {
      const entrada = suavizar(Math.min(1, Math.max(0, (ms - i * 50) / ENTRADA_MS)));
      const { x, y, z } = ubicar(p, medidas, t, avance);
      aux.position.set(x, y, z);
      aux.rotation.set(p.giro.x + t * p.velocidad.x, p.giro.y + t * p.velocidad.y, p.giro.z);
      aux.scale.setScalar(p.escala * entrada);
      aux.updateMatrix();
      mitadA.setMatrixAt(i, aux.matrix);
      aux.quaternion.multiply(volteo);
      aux.updateMatrix();
      mitadB.setMatrixAt(i, aux.matrix);
    });
    mitadA.instanceMatrix.needsUpdate = true;
    mitadB.instanceMatrix.needsUpdate = true;

    const f = ubicarFrasco(medidas, t);
    frasco.position.set(f.x, f.y, f.z);
    frasco.rotation.set(0.1, t * 0.25, -0.12);
  });

  return () => {
    redimension.disconnect();
    window.removeEventListener('pointermove', alMoverPuntero);
    motor.destruir();
  };
}
