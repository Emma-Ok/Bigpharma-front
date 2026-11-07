import { useEffect, useRef } from 'preact/hooks';
import { progresoDomicilio } from '@/dominio/domicilio';
import { celebrarDesde } from '@/compartido/movimiento/animaciones';

interface Props {
  total: number;
  umbral: number;
  variante: 'panel' | 'barra';
}

/** Barra de avance hacia el domicilio gratis; al llegar al 100 % se dibuja un check. */
export default function ProgresoDomicilio({ total, umbral, variante }: Props) {
  const { porcentaje, gratis } = progresoDomicilio(total, umbral);
  const barraRef = useRef<HTMLDivElement>(null);
  const antes = useRef<boolean | null>(null);
  // Al pasar a «domicilio gratis» por una acción (no al cargar la página), celebración desde la barra visible.
  useEffect(() => {
    const el = barraRef.current;
    if (antes.current === false && gratis && el && el.offsetParent !== null && total > 0) celebrarDesde(el);
    if (total > 0 || antes.current !== null) antes.current = gratis;
  }, [gratis, total]);
  const barra = (
    <div
      ref={barraRef}
      role="progressbar"
      aria-label="Avance hacia el domicilio gratis"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={porcentaje}
      class={`flex-1 overflow-hidden ${variante === 'panel' ? 'h-2 rounded-full bg-celadon' : 'h-[5px] bg-celadon'}`}
    >
      <div
        class="progreso-relleno h-full rounded-full bg-bottle transition-[width] duration-lenta ease-salida"
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
  if (variante === 'barra') return barra;
  return (
    <div class="flex items-center gap-2">
      {barra}
      {gratis && (
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" class="check-gratis shrink-0 text-bottle">
          <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      )}
    </div>
  );
}
