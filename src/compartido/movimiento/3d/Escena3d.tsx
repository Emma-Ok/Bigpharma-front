import { useEffect, useRef } from 'preact/hooks';
import { cuandoConvenga3d } from './cargador';

type Iniciar = (contenedor: HTMLElement) => () => void;

const ESCENAS: Record<'hero' | 'servicios', () => Promise<Iniciar>> = {
  hero: () => import('./hero').then((m) => m.iniciarHero),
  servicios: () => import('./servicios').then((m) => m.iniciarServicios),
};

interface Props {
  escena: keyof typeof ESCENAS;
  class?: string;
}

/**
 * Isla de una escena 3D (client:visible). three se importa de forma dinámica cuando conviene; hasta
 * entonces, y si no conviene, se ve la imagen estática del escenario ([data-escenario]).
 */
export default function Escena3d({ escena, class: clase }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let vigente = true;
    let destruir: (() => void) | undefined;
    cuandoConvenga3d(async () => {
      const iniciar = await ESCENAS[escena]();
      if (vigente && ref.current) destruir = iniciar(ref.current);
    });
    return () => {
      vigente = false;
      destruir?.();
    };
  }, [escena]);
  return <div ref={ref} aria-hidden="true" data-escena={escena} class={`pointer-events-none absolute inset-0 ${clase ?? ''}`} />;
}
