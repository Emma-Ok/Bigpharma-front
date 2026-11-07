export const FORMAS_DE_PAGO = ['Nequi', 'Llave Bre-B', 'Tarjeta, con link de pago', 'Efectivo al recibir'] as const;
export type FormaDePago = (typeof FORMAS_DE_PAGO)[number];

export interface DatosCliente {
  nombre: string;
  /** Barrio y dirección en un solo campo. */
  direccion: string;
  pago: FormaDePago;
}

export type CampoEntrega = 'nombre' | 'direccion' | 'autorizo';

const ERRORES_ENTREGA: Record<CampoEntrega, string> = {
  nombre: 'Escribe tu nombre.',
  direccion: 'Escribe tu barrio y dirección.',
  autorizo: 'Para enviar el pedido, autoriza el tratamiento de tus datos.',
};

/** Errores del formulario, en el orden de los campos: el primero recibe el foco. */
export function validarDatosEntrega(datos: { nombre: string; direccion: string; autorizo: boolean }): Partial<Record<CampoEntrega, string>> {
  const errores: Partial<Record<CampoEntrega, string>> = {};
  if (!datos.nombre.trim()) errores.nombre = ERRORES_ENTREGA.nombre;
  if (!datos.direccion.trim()) errores.direccion = ERRORES_ENTREGA.direccion;
  if (!datos.autorizo) errores.autorizo = ERRORES_ENTREGA.autorizo;
  return errores;
}
