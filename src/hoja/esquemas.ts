/** Esquemas Zod de las pestañas Productos, Configuracion y Anuncios. */
import { z } from 'astro/zod';
import { IDS_CATEGORIA, type CategoriaId, type Tipo } from '@/dominio/categorias';
import { esMarcador } from '@/dominio/formato';
import type { Disponibilidad } from '@/dominio/producto';

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

export const filaProducto = z.object({
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

export const configuracionEsquema = z.object({
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

export const filaAnuncio = z.object({
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
