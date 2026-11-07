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
