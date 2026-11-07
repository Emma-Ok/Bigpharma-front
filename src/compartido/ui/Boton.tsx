import type { ComponentChildren, JSX, Ref } from 'preact';

type Variante = 'primario' | 'secundario' | 'formula';
type Tamano = 'compacto' | 'normal' | 'grande';

interface Comunes {
  variante?: Variante;
  tamano?: Tamano;
  class?: string;
  children?: ComponentChildren;
}

type ComoEnlace = Comunes & { href: string } & Omit<JSX.IntrinsicElements['a'], 'class' | 'ref' | 'href'>;
type ComoBoton = Comunes & { href?: undefined; referencia?: Ref<HTMLButtonElement> } & Omit<JSX.IntrinsicElements['button'], 'class' | 'ref'>;

const BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-boton text-center font-semibold no-underline transition-colors duration-rapida';

const VARIANTES: Record<Variante, string> = {
  primario: 'border-0 bg-bottle text-blanco hover-fino:bg-bottle/90',
  secundario: 'border-2 border-bottle bg-blanco text-bottle',
  formula: 'border-0 bg-amber text-blanco',
};

const TAMANOS: Record<Tamano, string> = {
  compacto: 'min-h-11 px-4 text-[15px]',
  normal: 'min-h-12.5 px-5.5',
  grande: 'min-h-13.5 px-6 text-[17px]',
};

/** Botón o enlace con forma de botón. `formula` es solo para productos con fórmula médica. */
export default function Boton(props: ComoEnlace | ComoBoton) {
  const { variante = 'primario', tamano = 'normal', class: clase, children, ...resto } = props;
  const clases = `${BASE} ${VARIANTES[variante]} ${TAMANOS[tamano]} ${clase ?? ''}`;
  if (resto.href !== undefined) {
    return (
      <a {...(resto as JSX.IntrinsicElements['a'])} class={clases}>
        {children}
      </a>
    );
  }
  const { referencia, type = 'button', ...boton } = resto as Omit<ComoBoton, keyof Comunes>;
  return (
    <button {...boton} ref={referencia} type={type} class={clases}>
      {children}
    </button>
  );
}
