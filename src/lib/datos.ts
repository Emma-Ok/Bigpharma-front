/**
 * Datos del sitio, leídos en build desde Google Sheets publicado como CSV
 * (o desde datos/*.csv como respaldo) y validados con Zod.
 * Solo se usa en el servidor: los componentes del navegador importan tipos de ./catalogo.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'astro/zod';
import { csvAObjetos } from './csv';
import {
  IDS_CATEGORIA,
  type CategoriaId,
  type Producto,
  type Disponibilidad,
  type Tipo,
} from './catalogo';
import { aSlug, esMarcador, esUrl } from './formato';

// ---------- Esquemas ----------

const obligatorio = (campo: string) =>
  z.string().transform((v, ctx) => {
    const t = v.trim();
    if (!t) {
      ctx.addIssue({ code: 'custom', message: `falta «${campo}»` });
      return z.NEVER;
    }
    return t;
  });

const opcional = z.string().optional().transform((v) => (v?.trim() ? v.trim() : undefined));

const opcion = <T extends string>(campo: string, valores: readonly T[], obligatoria = true) =>
  z
    .string()
    .optional()
    .transform((v, ctx): T | undefined => {
      const t = (v ?? '').trim().toLowerCase();
      if (!t) {
        if (obligatoria) {
          ctx.addIssue({ code: 'custom', message: `falta «${campo}»` });
          return z.NEVER;
        }
        return undefined;
      }
      if (!valores.includes(t as T)) {
        ctx.addIssue({
          code: 'custom',
          message: `«${v}» no es un valor válido para «${campo}» (usa: ${valores.join(', ')})`,
        });
        return z.NEVER;
      }
      return t as T;
    });

/** Número sin puntos ni signos. Acepta «3500» y «3500.0» (exportación de Sheets). */
const numero = (campo: string, { entero = false } = {}) =>
  z
    .string()
    .optional()
    .transform((v, ctx): number | undefined => {
      const t = (v ?? '').trim();
      if (!t || esMarcador(t)) return undefined;
      const n = Number(t);
      if (!Number.isFinite(n) || n < 0 || (entero && !Number.isInteger(n))) {
        ctx.addIssue({
          code: 'custom',
          message: `«${t}» en «${campo}» debe ser un número${entero ? ' entero en pesos' : ''}, sin puntos ni signos`,
        });
        return z.NEVER;
      }
      return n;
    });

const filaProducto = z.object({
  id: obligatorio('id'),
  nombre: obligatorio('nombre'),
  categoria: opcion<CategoriaId>('categoria', IDS_CATEGORIA),
  tipo: opcion<Tipo>('tipo', ['med', 'cos', 'dis']),
  condicion_venta: opcion('condicion_venta', ['libre', 'formula'] as const),
  laboratorio_marca: obligatorio('laboratorio_marca'),
  principio_activo: opcional,
  concentracion: opcional,
  forma_farmaceutica: opcional,
  presentacion: obligatorio('presentacion'),
  unidades: numero('unidades'),
  unidad: opcional,
  precio: numero('precio', { entero: true }),
  precio_antes: numero('precio_antes', { entero: true }),
  registro_sanitario: obligatorio('registro_sanitario'),
  disponibilidad: opcion<Disponibilidad>('disponibilidad', ['disponible', 'pocas', 'agotado']),
  para_que_sirve: obligatorio('para_que_sirve'),
  como_se_usa: obligatorio('como_se_usa'),
  advertencias: obligatorio('advertencias'),
  foto_1: opcional,
  foto_2: opcional,
  foto_3: opcional,
  foto_4: opcional,
});

const configuracionEsquema = z.object({
  nombre_drogueria: obligatorio('nombre_drogueria'),
  whatsapp: obligatorio('whatsapp'),
  domicilio_gratis_desde: numero('domicilio_gratis_desde', { entero: true }).transform(
    (v, ctx) => {
      if (v === undefined) {
        ctx.addIssue({ code: 'custom', message: 'falta «domicilio_gratis_desde»' });
        return z.NEVER;
      }
      return v;
    },
  ),
  costo_domicilio: numero('costo_domicilio', { entero: true }),
  tiempo_entrega: obligatorio('tiempo_entrega'),
  zonas_cobertura: obligatorio('zonas_cobertura'),
  horario: obligatorio('horario'),
  barrio: opcional,
  aviso_1: opcional,
  aviso_2: opcional,
  aviso_3: opcional,
  profesional_nombre: obligatorio('profesional_nombre'),
  profesional_profesion: obligatorio('profesional_profesion'),
  profesional_registro: obligatorio('profesional_registro'),
  profesional_frase: opcional,
  profesional_foto: opcional,
  drogueria_codigo_inscripcion: obligatorio('drogueria_codigo_inscripcion'),
  autoridad_salud: opcional,
  razon_social: opcional,
  nit: opcional,
});

const filaAnuncio = z.object({
  id: obligatorio('id'),
  ubicacion: opcion('ubicacion', ['carrusel', 'lateral'] as const),
  titulo: obligatorio('titulo'),
  texto: opcional,
  boton_texto: opcional,
  enlace: opcional,
  categoria: opcion<CategoriaId>('categoria', IDS_CATEGORIA, false),
  foto: opcional,
  alt_foto: opcional,
  activo: opcional,
});

// ---------- Tipos públicos ----------

export interface Configuracion {
  nombreDrogueria: string;
  /** Solo dígitos, formato wa.me (573001234567). */
  whatsapp: string;
  domicilioGratisDesde: number;
  costoDomicilio?: number;
  tiempoEntrega: string;
  zonasCobertura: string;
  horario: string;
  barrio: string;
  avisos: string[];
  profesional: {
    nombre: string;
    profesion: string;
    registro: string;
    frase?: string;
    foto?: string;
  };
  codigoInscripcion: string;
  autoridadSalud: string;
  razonSocial: string;
  nit: string;
}

export interface Anuncio {
  id: string;
  ubicacion: 'carrusel' | 'lateral';
  titulo: string;
  texto?: string;
  botonTexto?: string;
  enlace?: string;
  categoria?: CategoriaId;
  foto?: string;
  altFoto: string;
}

export interface Resultado<T> {
  datos: T;
  errores: string[];
  avisos: string[];
}

// ---------- Validación (funciones puras) ----------

function mensajesDeError(error: z.ZodError): string[] {
  return error.issues.map((i) => i.message);
}

function rutaDeFoto(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return esUrl(v) || v.startsWith('/') ? v : undefined;
}

function contarMarcadores(filas: Record<string, string>[]): number {
  return filas.reduce((n, fila) => n + Object.values(fila).filter(esMarcador).length, 0);
}

export function validarProductos(filas: Record<string, string>[]): Resultado<Producto[]> {
  const errores: string[] = [];
  const avisos: string[] = [];
  const productos: Producto[] = [];
  const ids = new Set<string>();

  filas.forEach((fila, i) => {
    const etiqueta = `Productos, fila ${i + 2}${fila.id ? ` (id ${fila.id})` : ''}`;
    const r = filaProducto.safeParse(fila);
    if (!r.success) {
      for (const m of mensajesDeError(r.error)) errores.push(`${etiqueta}: ${m}`);
      return;
    }
    const f = r.data;
    if (ids.has(f.id)) {
      errores.push(`${etiqueta}: el id «${f.id}» está repetido`);
      return;
    }
    ids.add(f.id);

    const base = {
      id: f.id,
      slug: '',
      nombre: f.nombre,
      categoria: f.categoria!,
      tipo: f.tipo!,
      laboratorioMarca: f.laboratorio_marca,
      principioActivo: f.principio_activo,
      concentracion: f.concentracion,
      formaFarmaceutica: f.forma_farmaceutica,
      presentacion: f.presentacion,
      unidades: f.unidades,
      unidad: f.unidad,
      registroSanitario: f.registro_sanitario,
      disponibilidad: f.disponibilidad!,
      paraQueSirve: f.para_que_sirve,
      comoSeUsa: f.como_se_usa,
      advertencias: f.advertencias,
      fotos: [f.foto_1, f.foto_2, f.foto_3, f.foto_4].map(rutaDeFoto).filter((v): v is string => !!v),
    };

    if (f.condicion_venta === 'formula') {
      // Regla sanitaria: un medicamento con fórmula nunca lleva precio, aunque la hoja lo traiga.
      productos.push({ ...base, condicionVenta: 'formula' });
      return;
    }
    if (f.precio === undefined) {
      errores.push(`${etiqueta}: falta «precio» (obligatorio en venta libre)`);
      return;
    }
    let precioAntes = f.precio_antes;
    if (precioAntes !== undefined && precioAntes <= f.precio) {
      avisos.push(`${etiqueta}: «precio_antes» no es mayor que «precio»; se ignora`);
      precioAntes = undefined;
    }
    productos.push({
      ...base,
      condicionVenta: 'libre',
      precio: f.precio,
      precioAntes,
      descuentoPct: precioAntes ? Math.round((1 - f.precio / precioAntes) * 100) : undefined,
      precioPorUnidad:
        f.unidades && f.unidades > 1 ? Math.round(f.precio / f.unidades) : undefined,
    });
  });

  // Slug: nombre normalizado; si dos productos chocan, se agrega el id.
  const conteo = new Map<string, number>();
  for (const p of productos) {
    const s = aSlug(p.nombre);
    conteo.set(s, (conteo.get(s) ?? 0) + 1);
  }
  for (const p of productos) {
    const s = aSlug(p.nombre) || aSlug(p.id);
    p.slug = (conteo.get(s) ?? 0) > 1 ? `${s}-${aSlug(p.id)}` : s;
  }

  const marcadores = contarMarcadores(filas);
  if (marcadores) avisos.push(`Productos: ${marcadores} campos todavía tienen [texto por llenar]`);

  return { datos: productos, errores, avisos };
}

export function validarConfiguracion(filas: Record<string, string>[]): Resultado<Configuracion | null> {
  const pares = Object.fromEntries(
    filas.filter((f) => f.clave).map((f) => [f.clave.trim(), f.valor ?? '']),
  );
  const r = configuracionEsquema.safeParse(pares);
  if (!r.success) {
    return {
      datos: null,
      errores: mensajesDeError(r.error).map((m) => `Configuracion: ${m}`),
      avisos: [],
    };
  }
  const c = r.data;
  const avisos: string[] = [];
  const whatsapp = c.whatsapp.replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(whatsapp)) {
    avisos.push(`Configuracion: «whatsapp» (${c.whatsapp}) no es un número válido para wa.me`);
  }
  const marcadores = Object.values(pares).filter(esMarcador).length;
  if (marcadores) avisos.push(`Configuracion: ${marcadores} valores todavía tienen [texto por llenar]`);

  return {
    datos: {
      nombreDrogueria: c.nombre_drogueria,
      whatsapp,
      domicilioGratisDesde: c.domicilio_gratis_desde,
      costoDomicilio: c.costo_domicilio,
      tiempoEntrega: c.tiempo_entrega,
      zonasCobertura: c.zonas_cobertura,
      horario: c.horario,
      barrio: c.barrio ?? '[tu barrio]',
      avisos: [c.aviso_1, c.aviso_2, c.aviso_3].filter((v): v is string => !!v),
      profesional: {
        nombre: c.profesional_nombre,
        profesion: c.profesional_profesion,
        registro: c.profesional_registro,
        frase: c.profesional_frase,
        foto: rutaDeFoto(c.profesional_foto),
      },
      codigoInscripcion: c.drogueria_codigo_inscripcion,
      autoridadSalud: c.autoridad_salud ?? '[autoridad de salud]',
      razonSocial: c.razon_social ?? '[Razón social]',
      nit: c.nit ?? '[número]',
    },
    errores: [],
    avisos,
  };
}

export function validarAnuncios(filas: Record<string, string>[]): Resultado<Anuncio[]> {
  const errores: string[] = [];
  const anuncios: Anuncio[] = [];
  filas.forEach((fila, i) => {
    if ((fila.activo ?? '').trim().toLowerCase() !== 'si') return;
    const r = filaAnuncio.safeParse(fila);
    if (!r.success) {
      for (const m of mensajesDeError(r.error)) {
        errores.push(`Anuncios, fila ${i + 2}${fila.id ? ` (id ${fila.id})` : ''}: ${m}`);
      }
      return;
    }
    const a = r.data;
    anuncios.push({
      id: a.id,
      ubicacion: a.ubicacion!,
      titulo: a.titulo,
      texto: a.texto,
      botonTexto: a.boton_texto,
      enlace: a.enlace,
      categoria: a.categoria,
      foto: rutaDeFoto(a.foto),
      altFoto: a.alt_foto && !esMarcador(a.alt_foto) ? a.alt_foto : '',
    });
  });
  return { datos: anuncios, errores, avisos: [] };
}

// ---------- Lectura (build) ----------

export type Tabla = 'productos' | 'configuracion' | 'anuncios';

/** Variable de entorno: Cloudflare Pages la pone en process.env; en desarrollo viene de .env (import.meta.env). */
function variable(nombre: string): string | undefined {
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
