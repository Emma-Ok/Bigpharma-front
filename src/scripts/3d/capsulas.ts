/**
 * Cápsulas y tabletas flotantes (docs/MOVIMIENTO-Y-3D.md, sección 1).
 * - hero: portada; banda: cabecera del catálogo y página 404.
 * - Entrada: las piezas llegan volando desde el fondo. Niebla en celadon y luz de contorno suave.
 * - Puntero: parallax suave (6° máx.) y las piezas cercanas se apartan y giran.
 * - Scroll: la cámara se aleja y la escena se desvanece.
 * Las zonas con texto se calculan como fracción de la pantalla: ninguna pieza queda detrás de un texto.
 */
import { Color, Euler, InstancedMesh, MeshStandardMaterial, Object3D, Quaternion, Vector2 } from 'three';
import { crearMotor, esLigero, FONDO_CELADON } from './motor';
import {
  CAMARA,
  crearPiezas,
  geometriaMediaCapsula,
  geometriaTableta,
  MITAD_ALTO,
  PARES,
  TABLETAS,
  type Variante,
} from './piezas';

const PARALLAX_MAX = (6 * Math.PI) / 180;
const ENTRADA_MS = 1600;

const suavizar = (t: number) => 1 - Math.pow(1 - t, 3);

export function iniciarCapsulas(contenedor: HTMLElement, variante: Variante): () => void {
  const ligero = esLigero();
  const motor = crearMotor(contenedor, { ligero, fov: CAMARA.fov, distancia: CAMARA.z, niebla: FONDO_CELADON });
  // En contenedores bajos (bandas) la cámara hace zoom: las piezas se ven del mismo tamaño que en el hero.
  const zoom = Math.max(1, 620 / motor.alto());
  motor.camara.zoom = zoom;
  motor.camara.updateProjectionMatrix();
  const mitadAlto = MITAD_ALTO / zoom;
  const piezas = crearPiezas(variante, motor.ancho() / motor.alto(), mitadAlto);
  const capsulas = piezas.filter((p) => p.tipo === 'capsula');
  const tabletas = piezas.filter((p) => p.tipo === 'tableta');
  const material = new MeshStandardMaterial({ roughness: 0.4, metalness: 0 });
  const mitadA = new InstancedMesh(geometriaMediaCapsula(ligero ? 16 : 24), material, capsulas.length);
  const mitadB = new InstancedMesh(mitadA.geometry, material, capsulas.length);
  const mallaTabletas = new InstancedMesh(geometriaTableta(ligero ? 20 : 28), material, tabletas.length);
  capsulas.forEach((c, i) => {
    mitadA.setColorAt(i, new Color(PARES[c.color][0]));
    mitadB.setColorAt(i, new Color(PARES[c.color][1]));
  });
  tabletas.forEach((t, i) => mallaTabletas.setColorAt(i, new Color(TABLETAS[t.color])));
  motor.agregar(mitadA, mitadB, mallaTabletas);

  const empuje = piezas.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, giro: 0 }));
  const aux = new Object3D();
  const volteo = new Quaternion().setFromEuler(new Euler(Math.PI, 0, 0));
  const objetivo = new Vector2();
  const parallax = new Vector2();
  const puntero = new Vector2(1e3, 1e3);
  let interactivo = true;
  motor.alIrLento(() => {
    interactivo = false;
    mitadA.count = mitadB.count = Math.ceil(capsulas.length / 2);
    mallaTabletas.count = Math.ceil(tabletas.length / 2);
  });

  const alMoverPuntero = (e: PointerEvent) => {
    objetivo.set(
      ((e.clientX / window.innerWidth) * 2 - 1) * PARALLAX_MAX,
      ((e.clientY / window.innerHeight) * 2 - 1) * PARALLAX_MAX,
    );
    const r = contenedor.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    puntero.set(nx * mitadAlto * (motor.ancho() / motor.alto()), ny * mitadAlto);
  };
  const alSalir = () => puntero.set(1e3, 1e3);
  window.addEventListener('pointermove', alMoverPuntero, { passive: true });
  document.documentElement.addEventListener('pointerleave', alSalir);
  const alcanceScroll = variante === 'hero' ? (ligero ? 700 : 400) : 300;

  motor.animar((ms) => {
    const t = ms / 1000;
    if (interactivo) parallax.lerp(objetivo, 0.05);
    motor.escena.rotation.set(parallax.y, parallax.x, 0);
    const desplazado = Math.min(Math.max(0, -contenedor.getBoundingClientRect().top) / alcanceScroll, 1);
    motor.camara.position.z = CAMARA.z + (desplazado * 5 + Math.sin(t * 0.2) * 0.3) / zoom;
    motor.canvas.style.opacity = String(1 - desplazado);

    let ia = 0;
    let it = 0;
    piezas.forEach((p, i) => {
      const avance = suavizar(Math.min(1, Math.max(0, (ms - i * 35) / ENTRADA_MS)));
      const e = empuje[i];
      const px = p.x + Math.sin(t * 0.15 + p.fase) * 0.4;
      const py = p.y + Math.cos(t * 0.12 + p.fase) * 0.3;
      const dx = px - puntero.x;
      const dy = py - puntero.y;
      const d = Math.hypot(dx, dy);
      const alcance = 3.2 / zoom;
      if (interactivo && d < alcance && d > 0.001) {
        const fuerza = Math.pow(1 - d / alcance, 2) * 0.06;
        e.vx += (dx / d) * fuerza;
        e.vy += (dy / d) * fuerza;
        e.giro = Math.min(e.giro + fuerza * 4, 3);
      }
      e.vx = (e.vx - e.x * 0.02) * 0.9;
      e.vy = (e.vy - e.y * 0.02) * 0.9;
      e.x += e.vx;
      e.y += e.vy;
      e.giro *= 0.97;

      aux.position.set(px + e.x, py + e.y, -40 + (p.z + 40) * avance);
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
        mitadB.setMatrixAt(ia++, aux.matrix);
      } else {
        mallaTabletas.setMatrixAt(it++, aux.matrix);
      }
    });
    mitadA.instanceMatrix.needsUpdate = true;
    mitadB.instanceMatrix.needsUpdate = true;
    mallaTabletas.instanceMatrix.needsUpdate = true;
  });

  return () => {
    window.removeEventListener('pointermove', alMoverPuntero);
    document.documentElement.removeEventListener('pointerleave', alSalir);
    motor.destruir();
  };
}
