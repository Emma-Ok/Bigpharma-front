import { categoria } from '@/dominio/categorias';
import { leerFiltros } from '@/dominio/filtrosCatalogo';

/**
 * Enlace «volver» de celular (ver RutaNavegacion.astro). Siempre lleva a la página superior del sitio,
 * nunca a history.back(): funciona aunque se llegue desde Google o WhatsApp. En el navegador solo se
 * ajusta para que el catálogo vuelva con la búsqueda, la categoría y los filtros que tenía.
 */

/** Consulta del catálogo sin el «?», tal como la escribe usarFiltrosCatalogo. */
const CLAVE_CATALOGO = 'volver:catalogo';
/** Ruta de la página anterior en esta pestaña. */
const CLAVE_ANTERIOR = 'volver:anterior';
/** «1» si la ficha actual se abrió desde el catálogo (directo o pasando por otras fichas). */
const CLAVE_DESDE_CATALOGO = 'volver:desde-catalogo';

function leer(clave: string): string | null {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string) {
  try {
    sessionStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento el enlace queda con su destino por omisión.
  }
}

const sinBarraFinal = (ruta: string) => (ruta.length > 1 ? ruta.replace(/\/+$/, '') : ruta);
const esFicha = (ruta: string | null) => !!ruta && ruta.startsWith('/producto/');

/** El catálogo guarda su consulta cada vez que cambia. */
export function recordarCatalogo(consulta: string) {
  escribir(CLAVE_CATALOGO, consulta);
}

/** El catálogo con la búsqueda, la categoría y los filtros que tenía en esta pestaña. */
export function rutaCatalogo(): string {
  const consulta = leer(CLAVE_CATALOGO);
  return consulta ? `/catalogo?${consulta}` : '/catalogo';
}

/** Registra la página actual y ajusta los enlaces `[data-volver]`. Corre en cada carga de página. */
function actualizar() {
  const ruta = sinBarraFinal(location.pathname);
  const anterior = leer(CLAVE_ANTERIOR);
  escribir(CLAVE_ANTERIOR, ruta);

  let desdeCatalogo = false;
  if (esFicha(ruta)) {
    // Recargar o pasar de una ficha a otra conserva el origen; cualquier otra página lo borra.
    desdeCatalogo =
      anterior === '/catalogo' || ((anterior === ruta || esFicha(anterior)) && leer(CLAVE_DESDE_CATALOGO) === '1');
    escribir(CLAVE_DESDE_CATALOGO, desdeCatalogo ? '1' : '0');
  }

  for (const enlace of document.querySelectorAll<HTMLAnchorElement>('a[data-volver]')) {
    const modo = enlace.dataset.volver;
    if (modo === 'pedido') {
      enlace.href = rutaCatalogo();
    } else if (modo === 'ficha' && desdeCatalogo) {
      const destino = rutaCatalogo();
      enlace.href = destino;
      const id = leerFiltros(destino.split('?')[1] ?? '').categoria;
      const nombre = enlace.querySelector('[data-volver-nombre]');
      if (nombre) nombre.textContent = id ? categoria(id).nombre : 'Catálogo';
    }
  }
}

let iniciado = false;

export function iniciarVolver() {
  if (iniciado) return;
  iniciado = true;
  document.addEventListener('astro:page-load', actualizar);
}
