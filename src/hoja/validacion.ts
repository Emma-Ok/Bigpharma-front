/** Convierte las filas de la hoja en datos del dominio (funciones puras). */
import type { z } from 'astro/zod';
import { aSlug, esMarcador, esUrl } from '@/dominio/formato';
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
