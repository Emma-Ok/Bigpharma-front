import type { CategoriaId } from '../lib/catalogo';
import { RELLENO_CATEGORIA } from './estilosCategoria';

type Forma = 'caja' | 'frasco' | 'tubo' | 'paquete';

export function formaDe(presentacion: string, categoria: CategoriaId): Forma {
  if (categoria === 'formula' || /^caja/i.test(presentacion)) return 'caja';
  if (/^(frasco|botella)/i.test(presentacion)) return 'frasco';
  if (/^tubo/i.test(presentacion)) return 'tubo';
  return 'paquete';
}

interface Props {
  categoria: CategoriaId;
  presentacion: string;
  ancho: number;
  grosor?: number;
}

/** Empaque dibujado (mockups) para productos sin foto. Decorativo. */
export default function IlustracionProducto({ categoria, presentacion, ancho, grosor = 2 }: Props) {
  const color = RELLENO_CATEGORIA[categoria];
  const forma = formaDe(presentacion, categoria);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={ancho}
      height={Math.round(ancho * 1.1)}
      viewBox="0 0 100 110"
      fill="none"
      stroke-width={grosor}
      stroke-linejoin="round"
      class="stroke-ink"
    >
      {forma === 'caja' && (
        <>
          <path d="M20 32 L40 20 L84 20 L64 32 Z" class="fill-blanco" />
          <path d="M64 32 L84 20 L84 90 L64 102 Z" class="fill-paper" />
          <rect x="20" y="32" width="44" height="70" class="fill-blanco" />
          <rect x="20" y="58" width="44" height="16" class={color} />
          <path d="M27 42 H50 M27 48 H44" stroke-linecap="round" />
        </>
      )}
      {forma === 'frasco' && (
        <>
          <rect x="38" y="8" width="24" height="16" rx="3" class={color} />
          <path d="M41 24 H59 V32 H41 Z" class="fill-blanco" />
          <rect x="26" y="32" width="48" height="70" rx="12" class="fill-blanco" />
          <path d="M26 52 H74 V80 H26 Z" class={color} />
        </>
      )}
      {forma === 'tubo' && (
        <>
          <rect x="30" y="8" width="40" height="8" rx="2" class={color} />
          <path d="M30 16 H70 L64 86 H36 Z" class="fill-blanco" />
          <path d="M32.5 40 H67.5 L65.8 60 H34.2 Z" class={color} />
          <rect x="42" y="86" width="16" height="16" rx="3" class="fill-blanco" />
        </>
      )}
      {forma === 'paquete' && (
        <>
          <path
            d="M22 24 L30 16 L38 24 L46 16 L54 24 L62 16 L70 24 L78 16 V96 A6 6 0 0 1 72 102 H28 A6 6 0 0 1 22 96 Z"
            class="fill-blanco"
          />
          <rect x="22" y="44" width="56" height="22" class={color} />
          <path d="M32 80 H58 M32 87 H50" stroke-linecap="round" />
        </>
      )}
    </svg>
  );
}
