/** Convierte las filas de la hoja en datos del dominio (funciones puras). */
import type { z } from 'astro/zod';
import { aSlug, esMarcador, esUrl, tieneMarcador } from '@/dominio/formato';
import type { Producto } from '@/dominio/producto';
import type { Anuncio, Configuracion } from '@/dominio/sitio';
import { configuracionEsquema, filaAnuncio, filaProducto } from './esquemas';

export interface Resultado<T> {
  datos: T;
  errores: string[];
  avisos: string[];
}

function mensajesDeError(error: z.ZodError): string[] {
  return error.issues.map((i) => i.message);
}

function rutaDeFoto(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return esUrl(v) || v.startsWith('/') ? v : undefined;
}

/** La frase va entera dentro de la tarjeta del hero, sin recortes. */
export const FRASE_MAX = 90;

/** Los avisos van en una sola línea en la barra del celular. */
export const AVISO_MAX = 42;

/** Claves con un valor de respaldo [entre corchetes] en el sitio: si faltan en la hoja, también están por llenar. */
const CLAVES_CON_RESPALDO = ['barrio', 'autoridad_salud', 'razon_social', 'nit'];

/** Campos que no se pueden publicar: siguen con [texto por llenar]. Una línea por fila. */
export function camposPorLlenar(
  productos: Record<string, string>[],
  configuracion: Record<string, string>[],
  anuncios: Record<string, string>[],
): string[] {
  const conMarcador = (fila: Record<string, string>) =>
    Object.entries(fila)
      .filter(([, v]) => tieneMarcador(v))
      .map(([k]) => k);
  const claves = configuracion.filter((f) => f.clave?.trim());
  const faltan = [
    ...claves.filter((f) => tieneMarcador(f.valor)).map((f) => f.clave.trim()),
    ...CLAVES_CON_RESPALDO.filter((k) => !claves.some((f) => f.clave.trim() === k && f.valor?.trim())),
  ];
  const porFila = (pestana: string, filas: Record<string, string>[]) =>
    filas.flatMap((fila, i) => {
      const campos = conMarcador(fila);
      return campos.length ? [`${pestana}, fila ${i + 2}${fila.id ? ` (id ${fila.id})` : ''}: ${campos.join(', ')}`] : [];
    });
  return [
    ...(faltan.length ? [`Configuracion: ${[...new Set(faltan)].join(', ')}`] : []),
    ...porFila('Anuncios', anuncios.filter((f) => (f.activo ?? '').trim().toLowerCase() === 'si')),
    ...porFila('Productos', productos),
  ];
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
  for (const clave of ['aviso_1', 'aviso_2', 'aviso_3'] as const) {
    const largo = c[clave]?.length ?? 0;
    if (largo > AVISO_MAX) avisos.push(`Configuracion: «${clave}» tiene ${largo} caracteres (máximo ${AVISO_MAX})`);
  }
  if (c.profesional_frase && c.profesional_frase.length > FRASE_MAX) {
    avisos.push(`Configuracion: «profesional_frase» tiene ${c.profesional_frase.length} caracteres (máximo ${FRASE_MAX})`);
  }

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
