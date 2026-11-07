import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { vaciarPedido } from './acciones';
import Boton from '@/compartido/ui/Boton';
import Icono from '@/compartido/ui/Icono';

interface Props {
  /** Dónde poner el foco después de vaciar (el botón desaparece con la lista). */
  onVaciado: () => void;
}

/** «Vaciar pedido» con confirmación en dos pasos, para no perder el pedido por un toque accidental. */
export default function VaciarPedido({ onVaciado }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const idPregunta = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const volverAlBoton = useRef(false);

  useEffect(() => {
    if (confirmando) cancelar.current?.focus();
    else if (volverAlBoton.current) {
      boton.current?.focus();
      volverAlBoton.current = false;
    }
  }, [confirmando]);

  const conEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      volverAlBoton.current = true;
      setConfirmando(false);
    }
  };

  if (!confirmando) {
    return (
      <button
        ref={boton}
        type="button"
        onClick={() => setConfirmando(true)}
        class="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start border-0 bg-transparent p-0 text-[14.5px] font-semibold text-ink underline underline-offset-4"
      >
        <Icono nombre="papelera" tamano={18} />
        Vaciar pedido
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={idPregunta}
      class="flex flex-col gap-2.5 rounded-boton border border-bottle bg-celadon p-3"
    >
      <p id={idPregunta} class="m-0 text-[14.5px] font-semibold text-ink">
        ¿Quitar todos los productos de tu pedido?
      </p>
      <div class="flex flex-wrap gap-2">
        <Boton
          tamano="compacto"
          onKeyDown={conEsc}
          onClick={() => {
            vaciarPedido();
            onVaciado();
          }}
        >
          Sí, vaciar
        </Boton>
        <Boton
          referencia={cancelar}
          variante="secundario"
          tamano="compacto"
          onKeyDown={conEsc}
          onClick={() => {
            volverAlBoton.current = true;
            setConfirmando(false);
          }}
        >
          Cancelar
        </Boton>
      </div>
    </div>
  );
}
