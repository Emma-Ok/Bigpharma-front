/**
 * Empaque 3D del producto en su ficha (cuando no hay foto): caja, frasco, tubo o paquete con la
 * franja del color de su categoría. Gira despacio como en una vitrina y se inclina hacia el puntero.
 */
import { BoxGeometry, CylinderGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, Vector2 } from 'three';
import { crearMotor, esLigero } from './motor';

export type Forma = 'caja' | 'frasco' | 'tubo' | 'paquete';

interface Opciones {
  forma: Forma;
  /** Color de la categoría (#RRGGBB). */
  color: string;
  /** Fondo del recuadro (para la niebla). */
  fondo: string;
}

function modelo(forma: Forma, color: string, seg: number): Group {
  const blanco = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const lateral = new MeshStandardMaterial({ color: 0xf1f4f8, roughness: 0.55 });
  const marca = new MeshStandardMaterial({ color, roughness: 0.4 });
  const texto = new MeshStandardMaterial({ color: 0x1b2a3a, roughness: 0.6 });
  const g = new Group();
  if (forma === 'caja' || forma === 'paquete') {
    const [an, al, pr] = forma === 'caja' ? [1.5, 2.3, 0.85] : [2, 2.5, 0.42];
    g.add(new Mesh(new BoxGeometry(an, al, pr), [lateral, lateral, blanco, blanco, blanco, blanco]));
    const franja = new Mesh(new BoxGeometry(an + 0.01, al * 0.22, pr + 0.01), marca);
    franja.position.y = -al * 0.1;
    g.add(franja);
    for (const [y, w] of [
      [al * 0.3, an * 0.55],
      [al * 0.2, an * 0.38],
    ]) {
      const linea = new Mesh(new BoxGeometry(w, 0.05, 0.01), texto);
      linea.position.set(-an * 0.12, y, pr / 2 + 0.006);
      g.add(linea);
    }
    return g;
  }
  if (forma === 'frasco') {
    const perfil = [
      new Vector2(0, -1.15),
      new Vector2(0.78, -1.15),
      new Vector2(0.82, -1.05),
      new Vector2(0.82, 0.55),
      new Vector2(0.55, 0.85),
      new Vector2(0.42, 0.9),
      new Vector2(0.42, 1.05),
    ];
    g.add(new Mesh(new LatheGeometry(perfil, seg), blanco));
    const franja = new Mesh(new CylinderGeometry(0.83, 0.83, 0.8, seg, 1, true), marca);
    franja.position.y = -0.25;
    const tapa = new Mesh(new CylinderGeometry(0.48, 0.48, 0.45, seg), marca);
    tapa.position.y = 1.25;
    g.add(franja, tapa);
    return g;
  }
  // Tubo: cuerpo que se aplana hacia el sello y tapa abajo. La franja sigue el mismo aplanado.
  const aplanar = (geo: CylinderGeometry, yBase: number) => {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) + yBase;
      pos.setZ(i, pos.getZ(i) * (0.35 + 0.65 * (1 - (y + 1.15) / 2.3)));
    }
    geo.computeVertexNormals();
    return geo;
  };
  const cuerpo = new Mesh(aplanar(new CylinderGeometry(0.75, 0.55, 2.3, seg, 12), 0), blanco);
  const sello = new Mesh(new BoxGeometry(1.55, 0.18, 0.12), marca);
  sello.position.y = 1.2;
  // Radios del cuerpo a la altura de la franja (y de -0.1 a 0.4), un poco hacia afuera.
  const franja = new Mesh(aplanar(new CylinderGeometry(0.715, 0.672, 0.5, seg, 4, true), 0.15), marca);
  franja.position.y = 0.15;
  const tapa = new Mesh(new CylinderGeometry(0.3, 0.3, 0.42, seg), marca);
  tapa.position.y = -1.36;
  g.add(cuerpo, sello, franja, tapa);
  return g;
}

export function iniciarEmpaque(contenedor: HTMLElement, o: Opciones): () => void {
  const ligero = esLigero();
  const motor = crearMotor(contenedor, { ligero, fov: 30, distancia: 8, niebla: Number.parseInt(o.fondo.slice(1), 16) });
  const g = modelo(o.forma, o.color, ligero ? 24 : 40);
  g.rotation.set(0.12, -0.5, 0);
  motor.agregar(g);

  const objetivo = new Vector2();
  const inclinacion = new Vector2();
  const zona = contenedor.parentElement ?? contenedor;
  const alMover = (e: PointerEvent) => {
    const r = zona.getBoundingClientRect();
    objetivo.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const alSalir = () => objetivo.set(0, 0);
  zona.addEventListener('pointermove', alMover as EventListener, { passive: true });
  zona.addEventListener('pointerleave', alSalir);

  motor.animar((ms) => {
    const t = ms / 1000;
    // Entrada: el empaque sube y crece un poco; luego gira como en una vitrina.
    const entrada = 1 - Math.pow(1 - Math.min(1, ms / 900), 3);
    inclinacion.lerp(objetivo, 0.06);
    g.scale.setScalar(0.85 + 0.15 * entrada);
    g.position.y = (1 - entrada) * -0.6 + Math.sin(t * 1.1) * 0.08;
    g.rotation.y = -0.5 + t * 0.45 + inclinacion.x * 0.6;
    g.rotation.x = 0.12 + inclinacion.y * 0.25;
  });

  return () => {
    zona.removeEventListener('pointermove', alMover as EventListener);
    zona.removeEventListener('pointerleave', alSalir);
    motor.destruir();
  };
}
