/**
 * Escena de inyectología (sección «Servicios», inyectología en casa): jeringa de vidrio con
 * émbolo, líquido y aguja, y un frasco de medicamento. Flotan y giran despacio; cada pocos segundos
 * el émbolo baja y salen gotas de la aguja. Se inclinan hacia el puntero.
 */
import {
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector2,
} from 'three';
import { crearMotor, esLigero } from './motor';

const CELADON = 0xd5e5db;
const BOTTLE = 0x133b34;
const LIQUIDO = 0x4a5a55;
const INK = 0x1c2623;

export function iniciarServicios(contenedor: HTMLElement): () => void {
  const ligero = esLigero();
  const motor = crearMotor(contenedor, { ligero, fov: 30, distancia: 12, niebla: CELADON });
  const seg = ligero ? 20 : 32;

  const vidrio = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false });
  const liquido = new MeshStandardMaterial({ color: LIQUIDO, roughness: 0.25 });
  const plastico = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
  const goma = new MeshStandardMaterial({ color: INK, roughness: 0.6 });
  const metal = new MeshStandardMaterial({ color: CELADON, roughness: 0.2, metalness: 0.85 });
  const bottle = new MeshStandardMaterial({ color: BOTTLE, roughness: 0.35, metalness: 0.2 });

  // ---------- Jeringa ----------
  const jeringa = new Group();
  const largo = 3.2;
  const radio = 0.42;
  const cilindro = new Mesh(new CylinderGeometry(radio, radio, largo, seg, 1, true), vidrio);
  const contenido = new Mesh(new CylinderGeometry(radio * 0.9, radio * 0.9, 1, seg), liquido);
  const tope = new Mesh(new CylinderGeometry(radio * 0.92, radio * 0.92, 0.22, seg), goma);
  const vastago = new Mesh(new CylinderGeometry(0.1, 0.1, largo, 12), plastico);
  const pulgar = new Mesh(new CylinderGeometry(0.5, 0.5, 0.08, seg), plastico);
  const aletas = new Mesh(new CylinderGeometry(0.85, 0.85, 0.07, seg), plastico);
  aletas.scale.z = 0.45;
  const cono = new Mesh(new CylinderGeometry(radio, 0.14, 0.38, seg), plastico);
  const base = new Mesh(new CylinderGeometry(0.11, 0.11, 0.28, 12), bottle);
  const aguja = new Mesh(new CylinderGeometry(0.02, 0.02, 1.7, 8), metal);
  aletas.position.y = largo / 2;
  cono.position.y = -largo / 2 - 0.19;
  base.position.y = -largo / 2 - 0.5;
  aguja.position.y = -largo / 2 - 1.45;
  // Marcas de graduación sobre el vidrio.
  for (let i = 0; i < 7; i++) {
    const marca = new Mesh(new CylinderGeometry(radio + 0.005, radio + 0.005, 0.025, seg, 1, true, -0.5, 1), goma);
    marca.position.y = -largo / 2 + 0.45 + i * 0.36;
    jeringa.add(marca);
  }
  jeringa.add(cilindro, contenido, tope, vastago, pulgar, aletas, cono, base, aguja);

  /** Nivel del émbolo: 0 = lleno, 1 = vacío. */
  const ubicarEmbolo = (nivel: number) => {
    const altoLiquido = (largo - 0.35) * (1 - nivel * 0.55);
    contenido.scale.y = altoLiquido;
    contenido.position.y = -largo / 2 + altoLiquido / 2;
    tope.position.y = -largo / 2 + altoLiquido + 0.11;
    vastago.position.y = tope.position.y + largo / 2;
    pulgar.position.y = tope.position.y + largo + 0.04;
  };
  ubicarEmbolo(0);
  jeringa.rotation.set(0.15, 0, -0.62);
  jeringa.position.set(-1.1, 0.25, 0);

  // ---------- Frasco ----------
  const frasco = new Group();
  const perfil: Vector2[] = [
    new Vector2(0, -1),
    new Vector2(0.7, -1),
    new Vector2(0.78, -0.92),
    new Vector2(0.78, 0.45),
    new Vector2(0.55, 0.75),
    new Vector2(0.32, 0.85),
    new Vector2(0.32, 1.05),
  ];
  const cuerpo = new Mesh(new LatheGeometry(perfil, seg), vidrio);
  const liquidoFrasco = new Mesh(new CylinderGeometry(0.72, 0.72, 1.1, seg), liquido);
  liquidoFrasco.position.y = -0.4;
  const etiqueta = new Mesh(new CylinderGeometry(0.8, 0.8, 0.7, seg, 1, true), plastico);
  etiqueta.position.y = -0.15;
  const franja = new Mesh(new CylinderGeometry(0.805, 0.805, 0.16, seg, 1, true), bottle);
  franja.position.y = -0.05;
  const tapa = new Mesh(new CylinderGeometry(0.42, 0.42, 0.3, seg), bottle);
  tapa.position.y = 1.15;
  const goma2 = new Mesh(new CylinderGeometry(0.22, 0.22, 0.06, seg), goma);
  goma2.position.y = 1.32;
  frasco.add(cuerpo, liquidoFrasco, etiqueta, franja, tapa, goma2);
  frasco.position.set(2.1, -0.55, -1.2);
  frasco.rotation.set(0.2, 0, 0.18);

  // ---------- Gotas ----------
  const gota = new SphereGeometry(0.07, 12, 10);
  const gotas = Array.from({ length: 4 }, () => {
    const m = new Mesh(gota, liquido);
    m.visible = false;
    m.scale.set(1, 1.35, 1);
    return m;
  });
  const conjunto = new Group();
  conjunto.add(jeringa, frasco, ...gotas);
  motor.agregar(conjunto);

  // Inclinación hacia el puntero (sobre la sección).
  const objetivo = new Vector2();
  const inclinacion = new Vector2();
  const seccion = contenedor.closest('section') ?? contenedor;
  const alMover = (e: PointerEvent) => {
    const r = seccion.getBoundingClientRect();
    objetivo.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };
  seccion.addEventListener('pointermove', alMover as EventListener, { passive: true });
  let fluida = true;
  motor.alIrLento(() => (fluida = false));

  const CICLO = 5200;
  motor.animar((ms) => {
    const t = ms / 1000;
    if (fluida) inclinacion.lerp(objetivo, 0.04);
    conjunto.rotation.set(inclinacion.y * 0.18, inclinacion.x * 0.35 + Math.sin(t * 0.35) * 0.25, 0);
    jeringa.position.y = 0.25 + Math.sin(t * 0.9) * 0.12;
    frasco.position.y = -0.55 + Math.sin(t * 0.9 + 1.4) * 0.1;
    frasco.rotation.y = t * 0.4;

    // Ciclo del émbolo: baja, salen las gotas y vuelve a llenarse.
    const fase = (ms % CICLO) / CICLO;
    const empuje = fase < 0.45 ? 0 : fase < 0.6 ? (fase - 0.45) / 0.15 : fase < 0.85 ? 1 : 1 - (fase - 0.85) / 0.15;
    ubicarEmbolo(empuje);
    jeringa.updateMatrixWorld();
    const punta = aguja.localToWorld(aguja.position.clone().set(0, -0.85, 0));
    conjunto.worldToLocal(punta);
    gotas.forEach((g, i) => {
      const inicioGota = 0.55 + i * 0.05;
      const vida = (fase - inicioGota) / 0.3;
      g.visible = vida > 0 && vida < 1;
      if (g.visible) g.position.set(punta.x - vida * 0.25, punta.y - vida * vida * 2.2, punta.z);
    });
  });

  return () => {
    seccion.removeEventListener('pointermove', alMover as EventListener);
    motor.destruir();
  };
}
