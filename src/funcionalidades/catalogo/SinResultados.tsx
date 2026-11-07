import Boton from '@/compartido/ui/Boton';
import { enlaceWhatsApp, mensajeBusqueda, MENSAJE_GENERAL } from '@/dominio/whatsapp';

interface Props {
  consulta: string;
  whatsapp: string;
  onBorrar: () => void;
}

export default function SinResultados({ consulta, whatsapp, onBorrar }: Props) {
  return (
    <div class="flex flex-col gap-2.5 rounded-tarjeta border border-dashed border-muted p-5">
      <p class="m-0 text-[17px] font-semibold">No hay productos con esos filtros</p>
      <p class="m-0 text-[15px] text-muted">Cambia la búsqueda o pregúntanos si lo conseguimos.</p>
      <div class="flex flex-wrap gap-2.5">
        <Boton tamano="compacto" href={enlaceWhatsApp(whatsapp, consulta.trim() ? mensajeBusqueda(consulta) : MENSAJE_GENERAL)}>
          Preguntar por WhatsApp
        </Boton>
        <Boton variante="secundario" tamano="compacto" onClick={onBorrar}>
          Borrar filtros
        </Boton>
      </div>
    </div>
  );
}
