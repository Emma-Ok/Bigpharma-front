export const FORMAS_DE_PAGO = ['Nequi', 'Llave Bre-B', 'Tarjeta, con link de pago', 'Efectivo al recibir'] as const;
export type FormaDePago = (typeof FORMAS_DE_PAGO)[number];

export interface DatosCliente {
  nombre: string;
  /** Barrio y dirección en un solo campo. */
  direccion: string;
  pago: FormaDePago;
}
