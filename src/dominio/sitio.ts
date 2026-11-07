import type { CategoriaId } from './categorias';

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

const PROFESION_POR_DEFECTO = 'un químico farmacéutico';

/** «una química farmacéutica»: la profesión de la hoja con su artículo. Si falta o es un marcador, la de por defecto. */
export function profesionConArticulo(profesion: string): string {
  const texto = profesion.trim().toLowerCase();
  if (!texto || texto.startsWith('[')) return PROFESION_POR_DEFECTO;
  return `${texto.split(/\s+/)[0].endsWith('a') ? 'una' : 'un'} ${texto}`;
}

/** Lo que las islas necesitan saber de la tienda, en una sola prop. */
export interface Tienda {
  whatsapp: string;
  /** «Domicilio en 40 minutos a Chapinero.» */
  entrega: string;
  /** Domicilio gratis desde este valor. */
  umbral: number;
}

export function tiendaDe(c: Configuracion): Tienda {
  return {
    whatsapp: c.whatsapp,
    entrega: `Domicilio en ${c.tiempoEntrega} a ${c.zonasCobertura}.`,
    umbral: c.domicilioGratisDesde,
  };
}
