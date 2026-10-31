import { ICONOS, type NombreIcono } from './iconos';

interface Props {
  nombre: NombreIcono;
  tamano?: number;
  grosor?: number;
  class?: string;
}

export default function Icono({ nombre, tamano = 20, grosor = 2, class: clase }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={grosor}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`shrink-0 ${clase ?? ''}`}
      dangerouslySetInnerHTML={{ __html: ICONOS[nombre] }}
    />
  );
}
