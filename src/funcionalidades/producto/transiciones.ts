export function nombresDeTransicion(id: string) {
  return { foto: `producto-${id}-foto`, nombre: `producto-${id}-nombre` };
}

/**
 * Atributos de View Transition. El nombre lo aplica el CSS según el tipo de transición
 * (global.css): en el cambio de página, imagen y nombre; en la ficha rápida, solo la imagen elegida.
 */
export function atributosTransicion(nombre: string, elegida = false) {
  return { 'data-vt': '', 'data-vt-elegida': elegida ? '' : undefined, style: `--vt: ${nombre}` };
}
