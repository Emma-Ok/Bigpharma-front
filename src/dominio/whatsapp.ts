import { formatearPrecio } from './formato';
import type { LineaResuelta } from './carrito';
import type { DatosCliente } from './pedido';

/** Mensaje del pedido, sección 2 de la especificación. */
export function mensajePedido(
  lineas: Pick<LineaResuelta, 'cantidad' | 'subtotal' | 'producto'>[],
  cliente: Omit<DatosCliente, 'pago'> & { pago: string },
): string {
  const total = lineas.reduce((n, l) => n + l.subtotal, 0);
  return [
    'Hola, quiero hacer este pedido:',
    ...lineas.map((l) => `• ${l.cantidad} × ${l.producto.nombre}: ${formatearPrecio(l.subtotal)}`),
    `Subtotal: ${formatearPrecio(total)}`,
    `Nombre: ${cliente.nombre.trim()}`,
    `Dirección: ${cliente.direccion.trim()}`,
    `Pago: ${cliente.pago}`,
  ].join('\n');
}

export function mensajeFormula(producto: string): string {
  return `Hola, quiero consultar por ${producto}. Te envío la foto de mi fórmula.`;
}

export function mensajeDisponibilidad(producto: string): string {
  return `Hola, quiero saber cuándo vuelven a tener ${producto}.`;
}

export function mensajeBusqueda(consulta: string): string {
  return `Hola, ¿consiguen ${consulta.trim()}?`;
}

export const MENSAJE_INYECTOLOGIA =
  'Hola, quiero agendar una visita de inyectología a domicilio. Tengo la orden médica.';

export const MENSAJE_COTIZACION = 'Hola, quiero cotizar mi fórmula. Te envío la foto.';

export const MENSAJE_GENERAL = 'Hola, tengo una pregunta.';

/** «+57 300 123 4567»; si el número de la hoja aún no es válido, «+57 [número]». */
export function numeroVisible(numero: string): string {
  const d = numero.replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(d)) return '+57 [número]';
  const pais = d.slice(0, d.length - 10);
  const local = d.slice(-10);
  return `+${pais} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

export function enlaceWhatsApp(numero: string, mensaje?: string): string {
  const base = `https://wa.me/${numero.replace(/\D/g, '')}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
