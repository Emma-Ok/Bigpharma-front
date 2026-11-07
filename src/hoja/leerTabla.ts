/** Lee las pestañas publicadas de Google Sheets, con respaldo en datos/*.csv. Solo en build. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { csvAObjetos } from './csv';

export type Tabla = 'productos' | 'configuracion' | 'anuncios';

/** Variable de entorno: Cloudflare Pages la pone en process.env; en desarrollo viene de .env (import.meta.env). */
export function variable(nombre: string): string | undefined {
  const env = { ...process.env, ...(import.meta.env ?? {}) } as Record<string, string | undefined>;
  return env[nombre]?.trim() || undefined;
}

function urlDeTabla(tabla: Tabla): string | undefined {
  const clave = {
    productos: 'SHEETS_PRODUCTOS_CSV_URL',
    configuracion: 'SHEETS_CONFIGURACION_CSV_URL',
    anuncios: 'SHEETS_ANUNCIOS_CSV_URL',
  }[tabla];
  return variable(clave);
}

/**
 * Descarga la pestaña publicada. Sin URL configurada usa datos/<tabla>.csv.
 * Si la descarga falla: en desarrollo usa el respaldo local; en build falla,
 * para no publicar precios viejos (Cloudflare conserva el despliegue anterior).
 */
export async function leerTabla(tabla: Tabla): Promise<{ filas: Record<string, string>[]; origen: string }> {
  const archivo = path.resolve(process.cwd(), 'datos', `${tabla}.csv`);
  const url = urlDeTabla(tabla);
  if (url) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { filas: csvAObjetos(await r.text()), origen: 'Google Sheets' };
    } catch (e) {
      const motivo = e instanceof Error ? e.message : String(e);
      if (!import.meta.env?.DEV) {
        throw new Error(`No se pudo descargar la pestaña «${tabla}» (${motivo}). Revisa la URL publicada.`);
      }
      console.warn(`[datos] «${tabla}»: falló la descarga (${motivo}); uso ${archivo}`);
    }
  }
  return { filas: csvAObjetos(await readFile(archivo, 'utf8')), origen: archivo };
}
