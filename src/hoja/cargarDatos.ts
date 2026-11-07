/**
 * Datos del sitio, leídos en build desde Google Sheets publicado como CSV
 * (o desde datos/*.csv como respaldo) y validados con Zod.
 * Solo se usa en el servidor: el navegador importa los tipos de @/dominio.
 */
import type { Producto } from '@/dominio/producto';
import type { Anuncio, Configuracion } from '@/dominio/sitio';
import { leerTabla, variable } from './leerTabla';
import { camposPorLlenar, validarAnuncios, validarConfiguracion, validarProductos } from './validacion';

export interface DatosSitio {
  productos: Producto[];
  configuracion: Configuracion;
  anuncios: Anuncio[];
}

let cache: Promise<DatosSitio> | undefined;

/**
 * Solo con SITIO_PUBLICO=si los buscadores pueden indexar el sitio. Sin ella (desarrollo, pruebas y
 * despliegues de prueba) todas las páginas llevan noindex y robots.txt no anuncia el sitemap.
 */
export const sitioPublico = () => variable('SITIO_PUBLICO') === 'si';

/**
 * Carga y valida todo una sola vez por build. Lanza un error con la lista de problemas.
 * Con VALIDAR_HOJA=estricto, los campos [por llenar] y los avisos también detienen el build; sin ella, solo avisan.
 */
export function cargarDatos(): Promise<DatosSitio> {
  cache ??= (async () => {
    const [p, c, a] = await Promise.all([
      leerTabla('productos'),
      leerTabla('configuracion'),
      leerTabla('anuncios'),
    ]);
    const productos = validarProductos(p.filas);
    const configuracion = validarConfiguracion(c.filas);
    const anuncios = validarAnuncios(a.filas);
    const errores = [...productos.errores, ...configuracion.errores, ...anuncios.errores];
    const avisos = [...productos.avisos, ...configuracion.avisos, ...anuncios.avisos];
    const estricto = variable('VALIDAR_HOJA') === 'estricto';

    const porLlenar = camposPorLlenar(p.filas, c.filas, a.filas);

    if (avisos.length) console.warn(`[datos] Avisos:\n  - ${avisos.join('\n  - ')}`);
    if (porLlenar.length) console.warn(`[datos] Campos con [texto por llenar]:\n  - ${porLlenar.join('\n  - ')}`);
    if (estricto) errores.push(...avisos, ...porLlenar.map((m) => `Por llenar: ${m}`));
    if (errores.length || !configuracion.datos) {
      throw new Error(`Los datos de la hoja tienen errores:\n  - ${errores.join('\n  - ')}`);
    }
    return {
      productos: productos.datos,
      configuracion: configuracion.datos,
      anuncios: anuncios.datos,
    };
  })();
  return cache;
}
