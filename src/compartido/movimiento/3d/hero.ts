/**
 * Escena del hero (docs/MOVIMIENTO-Y-3D.md, sección 1): cápsulas y un frasco de vidrio ámbar alrededor
 * de la tarjeta del profesional. El canvas va encima de la tarjeta y un plano invisible del tamaño de
 * la tarjeta escribe solo profundidad: lo que pasa por detrás queda tapado y lo que pasa por delante
 * se ve sobre la foto. Así basta un contexto WebGL.
 *
 * La cámara tiene una escala fija en píxeles y cada pieza se proyecta exactamente a su lugar en pantalla
 * (piezas.ts): el primer cuadro coincide con la imagen estática en cualquier ancho.
 * Parallax: con el puntero en escritorio y con el scroll en celular.
 */
import {
  Color,
  CylinderGeometry,
  Euler,
  Group,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Shape,
  ShapeGeometry,
  Vector2,
} from 'three';
import { crearMotor, esLigero } from './motor';
import { CAMARA_Z, ENCUADRES, geometriaMediaCapsula, PARES, ubicar, type Ancla, type Encuadre } from './piezas';

const FONDO_PAPER = 0xf3f5f1;
const ESCRITORIO = '(min-width: 56.25rem)';

const PARALLAX_MAX = (6 * Math.PI) / 180;
const AMBAR = 0xa8621a;
const AMBAR_OSCURO = 0x8a4e12;
const BOTTLE = 0x133b34;
const RADIO_TARJETA_PX = 20;

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

function montar(contenedor: HTMLElement, tarjeta: HTMLElement, foto: HTMLElement, encuadre: Encuadre): () => void {
  const ligero = esLigero();
  const { piezas, pxPorUnidad } = encuadre;
  const u = 1 / pxPorUnidad;
  const motor = crearMotor(contenedor, { ligero, distancia: CAMARA_Z, niebla: FONDO_PAPER });
  const seg = ligero ? 16 : 24;
  const material = new MeshStandardMaterial({ roughness: 0.4, metalness: 0 });
  const mitadA = new InstancedMesh(geometriaMediaCapsula(seg), material, piezas.length);
  const mitadB = new InstancedMesh(mitadA.geometry, material, piezas.length);
  piezas.forEach((p, i) => {
    mitadA.setColorAt(i, new Color(PARES[p.color][0]));
    mitadB.setColorAt(i, new Color(PARES[p.color][1]));
  });
  const frasco = crearFrasco(ligero ? 20 : 32);
  frasco.scale.setScalar(encuadre.frasco.escala);
  const grupo = new Group();
  grupo.add(mitadA, mitadB, frasco);

  const oclusor = new Mesh(new ShapeGeometry(new Shape()), new MeshBasicMaterial({ colorWrite: false }));
  oclusor.renderOrder = -1;
  motor.agregar(oclusor, grupo);

  // Anclas en píxeles desde el centro del canvas (y hacia abajo).
  const anclas: Record<Ancla, { x: number; y: number }> = { tarjeta: { x: 0, y: 0 }, derecha: { x: 0, y: 0 }, izquierda: { x: 0, y: 0 } };
  const medir = () => {
    const c = contenedor.getBoundingClientRect();
    const t = tarjeta.getBoundingClientRect();
    const f = foto.getBoundingClientRect();
    if (!c.height || !t.height) return;
    const centroX = c.left + c.width / 2;
    const centroY = c.top + c.height / 2;
    anclas.tarjeta = { x: f.left + f.width / 2 - centroX, y: f.top + f.height / 2 - centroY };
    anclas.derecha = { x: window.innerWidth - centroX, y: 0 };
    anclas.izquierda = { x: -centroX, y: 0 };
    // La altura visible en z = 0 es la del canvas en unidades: la escala no depende del tamaño.
    motor.camara.fov = (2 * Math.atan((c.height * u) / 2 / CAMARA_Z) * 180) / Math.PI;
    motor.camara.updateProjectionMatrix();
    oclusor.geometry.dispose();
    oclusor.geometry = new ShapeGeometry(formaTarjeta(t.width * u, t.height * u, RADIO_TARJETA_PX * u), 8);
    oclusor.position.set((t.left + t.width / 2 - centroX) * u, -(t.top + t.height / 2 - centroY) * u, 0);
  };
  medir();
  const redimension = new ResizeObserver(medir);
  redimension.observe(contenedor);

  /** Punto de la escena que se proyecta en ese lugar de la pantalla a esa profundidad. */
  const aEscena = (ancla: Ancla, x: number, y: number, z: number, destino: Object3D) => {
    const k = (u * (CAMARA_Z - z)) / CAMARA_Z;
    destino.position.set((anclas[ancla].x + x) * k, -(anclas[ancla].y + y) * k, z);
  };

  const aux = new Object3D();
  const volteo = new Quaternion().setFromEuler(new Euler(Math.PI, 0, 0));
  const objetivo = new Vector2();
  const parallax = new Vector2();
  let scroll = 0;
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
    if (ligero && conParallax) {
      const r = contenedor.getBoundingClientRect();
      // Suavizado desde 0: el primer cuadro coincide con la imagen aunque la página ya esté desplazada.
      scroll += (Math.min(Math.max(0, -r.top / r.height), 1) - scroll) * 0.06;
      objetivo.set(0, scroll * PARALLAX_MAX * 2);
      grupo.position.y = scroll * 1.2;
    }
    parallax.lerp(objetivo, 0.06);
    grupo.rotation.set(parallax.y, parallax.x, 0);

    piezas.forEach((p, i) => {
      const { x, y, z } = ubicar(p, t, scroll * 1.4);
      aEscena(p.ancla, x, y, z, aux);
      aux.rotation.set(p.giro[0] + t * p.velocidad[0], p.giro[1] + t * p.velocidad[1], p.giro[2]);
      aux.scale.setScalar(p.escala);
      aux.updateMatrix();
      mitadA.setMatrixAt(i, aux.matrix);
      aux.quaternion.multiply(volteo);
      aux.updateMatrix();
      mitadB.setMatrixAt(i, aux.matrix);
    });
    mitadA.instanceMatrix.needsUpdate = true;
    mitadB.instanceMatrix.needsUpdate = true;

    const f = encuadre.frasco;
    aEscena('tarjeta', f.x, f.y + Math.sin(t * 0.3) * 6, f.z, frasco);
    frasco.rotation.set(0.1, t * 0.25, -0.12);
  });

  return () => {
    redimension.disconnect();
    window.removeEventListener('pointermove', alMoverPuntero);
    motor.destruir();
  };
}

export function iniciarHero(contenedor: HTMLElement): () => void {
  const escenario = contenedor.closest<HTMLElement>('[data-escenario]');
  const tarjeta = escenario?.querySelector<HTMLElement>('[data-tarjeta-hero]');
  const foto = escenario?.querySelector<HTMLElement>('[data-foto-hero]');
  if (!tarjeta || !foto) return () => {};

  const escritorio = window.matchMedia(ESCRITORIO);
  const arrancar = () => montar(contenedor, tarjeta, foto, ENCUADRES[escritorio.matches ? 'escritorio' : 'celular']);
  let destruir = arrancar();
  const alCambiar = () => {
    destruir();
    destruir = arrancar();
  };
  escritorio.addEventListener('change', alCambiar);
  return () => {
    escritorio.removeEventListener('change', alCambiar);
    destruir();
  };
}
