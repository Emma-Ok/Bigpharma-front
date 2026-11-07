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

const ES_PRODUCTO = /^\/producto\//;

/**
 * La imagen y el nombre viajan de la tarjeta a la ficha solo si la navegación entra o sale de la página de un
 * producto. Entre dos listas (portada y catálogo), cada producto saltaría a su nuevo lugar cruzando a los demás.
 * Marca la página actual y la nueva: el router reemplaza los atributos de <html> al cambiar de página.
 */
export function marcarNavegacionDeProducto() {
  let deProducto = false;
  document.addEventListener('astro:before-preparation', (e) => {
    deProducto = ES_PRODUCTO.test(e.to.pathname) || ES_PRODUCTO.test(e.from.pathname);
    document.documentElement.toggleAttribute('data-vt-producto', deProducto);
  });
  document.addEventListener('astro:before-swap', (e) => {
    e.newDocument.documentElement.toggleAttribute('data-vt-producto', deProducto);
  });
}
