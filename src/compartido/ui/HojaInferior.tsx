import { useEffect, useId, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Icono from './Icono';

interface Props {
  abierta: boolean;
  titulo: string;
  etiquetaCerrar: string;
  onCerrar: () => void;
  id?: string;
  children: ComponentChildren;
}

/**
 * Hoja inferior en celular y diálogo centrado desde 1200 px: <dialog> modal, Esc y el fondo la cierran
 * y el foco vuelve al elemento que la abrió (nativo del <dialog>).
 */
export default function HojaInferior({ abierta, titulo, etiquetaCerrar, onCerrar, id, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    // Clic en el fondo cierra; con teclado cierra Esc (nativo del <dialog>).
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={dialogo}
      id={id}
      aria-modal="true"
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      class="hoja-inferior mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-panel-grande border-0 bg-blanco p-5 pb-[calc(20px+env(safe-area-inset-bottom))] text-ink shadow-flotante backdrop:bg-ink/45 lg:m-auto lg:max-w-md lg:rounded-panel lg:p-6"
    >
      <div class="mb-3.5 flex items-center justify-between gap-3">
        <h2 id={idTitulo} class="m-0 text-[21px] leading-tight font-semibold">
          {titulo}
        </h2>
        <button
          type="button"
          aria-label={etiquetaCerrar}
          onClick={() => dialogo.current?.close()}
          class="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-boton border-2 border-ink bg-blanco text-ink"
        >
          <Icono nombre="cerrar" grosor={2.4} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
