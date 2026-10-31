/**
 * Celebración: una explosión de cápsulas y tabletas desde un punto de la pantalla (el botón que
 * se tocó) que caen con gravedad y desaparecen. Responde a una acción del cliente: enviar el pedido
 * o alcanzar el domicilio gratis. Dura menos de 2 s.
 */
import { Color, Euler, InstancedMesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import { geometriaMediaCapsula, geometriaTableta, PARES, TABLETAS } from './piezas';
import { crearMotor, esLigero } from './motor';

const DURACION = 1900;

export function celebrar(origen: { x: number; y: number }) {
  const capa = document.createElement('div');
  capa.setAttribute('aria-hidden', 'true');
  Object.assign(capa.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '70' });
  document.body.append(capa);

  const ligero = esLigero();
  const motor = crearMotor(capa, { ligero, fov: 40, distancia: 14, pantallaCompleta: true });
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

  // Punto de la pantalla → plano z = 0 de la escena.
  const mitadAlto = Math.tan(((40 / 2) * Math.PI) / 180) * 14;
  const mitadAncho = mitadAlto * (window.innerWidth / window.innerHeight);
  const inicio = new Vector3(
    (origen.x / window.innerWidth) * 2 * mitadAncho - mitadAncho,
    -((origen.y / window.innerHeight) * 2 * mitadAlto - mitadAlto),
    0,
  );
  const total = nCapsulas + nTabletas;
  const piezas = Array.from({ length: total }, () => {
    const angulo = Math.random() * Math.PI * 2;
    const fuerza = 0.12 + Math.random() * 0.2;
    return {
      p: inicio.clone(),
      v: new Vector3(Math.cos(angulo) * fuerza, 0.22 + Math.random() * 0.28, (Math.random() - 0.5) * 0.2),
      giro: new Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      vg: new Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3),
      escala: 0.7 + Math.random() * 0.5,
    };
  });
  const aux = new Object3D();
  const volteo = new Quaternion().setFromEuler(new Euler(Math.PI, 0, 0));

  let terminado = false;
  const terminar = () => {
    if (terminado) return;
    terminado = true;
    motor.destruir();
    capa.remove();
  };
  motor.animar((ms, dt) => {
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
    if (ms > DURACION) setTimeout(terminar, 0);
  });
  // Por si la pestaña se oculta a mitad de la animación.
  setTimeout(terminar, DURACION + 1500);
}
