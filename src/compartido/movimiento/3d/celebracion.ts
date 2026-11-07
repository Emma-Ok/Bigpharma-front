/**
 * Celebración al llegar al domicilio gratis: una explosión de cápsulas y tabletas desde la barra de
 * progreso, que caen con gravedad y desaparecen. Dura menos de 2 s.
 *
 * Nada de esto puede bloquear la interfaz: `preparar` compila los shaders en reposo, antes de que haga falta,
 * y mide unos cuadros. Si el equipo no llega a 40 fps, se libera todo y la celebración no existe.
 */
import { Color, Euler, InstancedMesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import { geometriaMediaCapsula, geometriaTableta, PARES, TABLETAS } from './piezas';
import { crearMotor, esLigero } from './motor';

const DURACION = 1900;
const FOV = 40;
const DISTANCIA = 14;
const MUESTRAS = 12;
/** 40 fps. */
const CUADRO_MAX_MS = 25;

export type Celebrar = (origen: { x: number; y: number }) => void;

/** Devuelve la función que lanza la celebración, o null si este equipo no la puede mover. */
export async function preparar(): Promise<Celebrar | null> {
  const capa = document.createElement('div');
  capa.setAttribute('aria-hidden', 'true');
  Object.assign(capa.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '70', visibility: 'hidden' });
  document.body.append(capa);

  const ligero = esLigero();
  const motor = crearMotor(capa, { ligero, fov: FOV, distancia: DISTANCIA, pantallaCompleta: true });
  Object.assign(motor.canvas.style, { opacity: '1', transition: 'none' });
  const nCapsulas = ligero ? 18 : 30;
  const nTabletas = ligero ? 10 : 16;
  const material = new MeshStandardMaterial({ roughness: 0.4, transparent: true });
  const mitadA = new InstancedMesh(geometriaMediaCapsula(16), material, nCapsulas);
  const mitadB = new InstancedMesh(mitadA.geometry, material, nCapsulas);
  const tabletas = new InstancedMesh(geometriaTableta(20), material, nTabletas);
  for (let i = 0; i < nCapsulas; i++) {
    mitadA.setColorAt(i, new Color(PARES[i % PARES.length][0]));
    mitadB.setColorAt(i, new Color(PARES[i % PARES.length][1]));
  }
  for (let i = 0; i < nTabletas; i++) tabletas.setColorAt(i, new Color(TABLETAS[i % TABLETAS.length]));
  motor.agregar(mitadA, mitadB, tabletas);

  const piezas = Array.from({ length: nCapsulas + nTabletas }, () => ({
    p: new Vector3(),
    v: new Vector3(),
    giro: new Euler(),
    vg: new Vector3(),
    escala: 1,
  }));
  const aux = new Object3D();
  const volteo = new Quaternion().setFromEuler(new Euler(Math.PI, 0, 0));

  /** Punto de la pantalla → plano z = 0 de la escena. */
  const colocar = (origen: { x: number; y: number }) => {
    const mitadAlto = Math.tan(((FOV / 2) * Math.PI) / 180) * DISTANCIA;
    const mitadAncho = mitadAlto * (window.innerWidth / window.innerHeight);
    const x = (origen.x / window.innerWidth) * 2 * mitadAncho - mitadAncho;
    const y = -((origen.y / window.innerHeight) * 2 * mitadAlto - mitadAlto);
    for (const pz of piezas) {
      const angulo = Math.random() * Math.PI * 2;
      const fuerza = 0.12 + Math.random() * 0.2;
      pz.p.set(x, y, 0);
      pz.v.set(Math.cos(angulo) * fuerza, 0.22 + Math.random() * 0.28, (Math.random() - 0.5) * 0.2);
      pz.giro.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      pz.vg.set((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);
      pz.escala = 0.7 + Math.random() * 0.5;
    }
  };

  const paso = (ms: number, dt: number) => {
    const k = dt / 16.7;
    material.opacity = ms > DURACION - 450 ? Math.max(0, (DURACION - ms) / 450) : 1;
    piezas.forEach((pz, i) => {
      pz.v.y -= 0.012 * k;
      pz.v.multiplyScalar(0.992);
      pz.p.addScaledVector(pz.v, k);
      pz.giro.x += pz.vg.x * k;
      pz.giro.y += pz.vg.y * k;
      pz.giro.z += pz.vg.z * k;
      aux.position.copy(pz.p);
      aux.rotation.copy(pz.giro);
      aux.scale.setScalar(pz.escala * Math.min(1, ms / 120));
      aux.updateMatrix();
      if (i < nCapsulas) {
        mitadA.setMatrixAt(i, aux.matrix);
        aux.quaternion.multiply(volteo);
        aux.updateMatrix();
        mitadB.setMatrixAt(i, aux.matrix);
      } else {
        tabletas.setMatrixAt(i - nCapsulas, aux.matrix);
      }
    });
    mitadA.instanceMatrix.needsUpdate = true;
    mitadB.instanceMatrix.needsUpdate = true;
    tabletas.instanceMatrix.needsUpdate = true;
  };

  /** Mediana de lo que tarda un cuadro completo; readPixels espera a que la GPU termine. */
  const medirCuadro = async () => {
    const gl = motor.renderer.getContext();
    const pixel = new Uint8Array(4);
    const tiempos: number[] = [];
    colocar({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    for (let i = 0; i < MUESTRAS; i++) {
      await new Promise(requestAnimationFrame);
      const antes = performance.now();
      paso(300 + i * 16, 16);
      motor.renderer.render(motor.escena, motor.camara);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      tiempos.push(performance.now() - antes);
      if (tiempos.at(-1)! > CUADRO_MAX_MS * 4) return Number.POSITIVE_INFINITY;
    }
    return tiempos.sort((a, b) => a - b)[MUESTRAS >> 1];
  };

  await motor.renderer.compileAsync(motor.escena, motor.camara);
  if ((await medirCuadro()) > CUADRO_MAX_MS) {
    motor.destruir();
    capa.remove();
    return null;
  }

  let corriendo = false;
  const terminar = () => {
    if (!corriendo) return;
    corriendo = false;
    motor.detener();
    capa.style.visibility = 'hidden';
  };
  return (origen) => {
    if (corriendo) return;
    corriendo = true;
    // Un cambio de página reemplaza el body: la capa vuelve con su contexto y sus shaders ya compilados.
    if (!capa.isConnected) document.body.append(capa);
    capa.style.visibility = 'visible';
    colocar(origen);
    motor.animar((ms, dt) => {
      paso(ms, dt);
      if (ms > DURACION) setTimeout(terminar, 0);
    });
    // Por si la pestaña se oculta a mitad de la animación.
    setTimeout(terminar, DURACION + 1500);
  };
}
