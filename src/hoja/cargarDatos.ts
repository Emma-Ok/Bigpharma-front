/**
 * Datos del sitio, leídos en build desde Google Sheets publicado como CSV
 * (o desde datos/*.csv como respaldo) y validados con Zod.
 * Solo se usa en el servidor: el navegador importa los tipos de @/dominio.
 */
import type { Producto } from '@/dominio/producto';
import type { Anuncio, Configuracion } from '@/dominio/sitio';
import { leerTabla, variable } from './leerTabla';
import { validarAnuncios, validarConfiguracion, validarProductos } from './validacion';

export interface DatosSitio {
  productos: Producto[];
  configuracion: Configuracion;
  anuncios: Anuncio[];
}

let cache: Promise<DatosSitio> | undefined;

/** Carga y valida todo una sola vez por build. Lanza un error con la lista de problemas. */
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
    const estricto = variable('DATOS_ESTRICTOS') === '1';

    if (avisos.length) {
      console.warn(`[datos] Avisos:\n  - ${avisos.join('\n  - ')}`);
    }
    if (estricto && avisos.length) errores.push(...avisos.map((m) => `(modo estricto) ${m}`));
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
