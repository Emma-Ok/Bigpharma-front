import { describe, expect, it } from 'vitest';
import { enlaceWhatsApp, mensajeFormula, mensajePedido, numeroVisible } from '../whatsapp';
import { resolverLineas } from '../carrito';
import type { ProductoResumen } from '../producto';

const catalogo: ProductoResumen[] = [
  {
    id: 'a1', slug: 'acetaminofen-500-mg', nombre: 'Acetaminofén 500 mg', categoria: 'dolor', tipo: 'med',
    presentacion: 'Caja × 10 tabletas', disponibilidad: 'disponible', condicionVenta: 'libre', precio: 3500,
  },
  {
    id: 'c1', slug: 'suero-oral', nombre: 'Suero oral', categoria: 'estomago', tipo: 'med',
    presentacion: 'Botella × 500 ml', disponibilidad: 'disponible', condicionVenta: 'libre', precio: 6200,
  },
];

describe('mensajePedido', () => {
  it('coincide con el formato de la sección 2 de la especificación', () => {
    const lineas = resolverLineas(
      [
        { id: 'a1', cantidad: 2 },
        { id: 'c1', cantidad: 1 },
      ],
      catalogo,
    );
    const mensaje = mensajePedido(lineas, { nombre: ' Ana Pérez ', direccion: 'Cra 1 # 2-3, Chapinero', pago: 'Nequi' });
    expect(mensaje).toBe(
      [
        'Hola, quiero hacer este pedido:',
        '• 2 × Acetaminofén 500 mg: $7.000',
        '• 1 × Suero oral: $6.200',
        'Subtotal: $13.200',
        'Nombre: Ana Pérez',
        'Dirección: Cra 1 # 2-3, Chapinero',
        'Pago: Nequi',
      ].join('\n'),
    );
  });
});

describe('mensajes y enlaces', () => {
  it('mensaje para medicamentos con fórmula', () => {
    expect(mensajeFormula('Amoxicilina 500 mg')).toBe(
      'Hola, quiero consultar por Amoxicilina 500 mg. Te envío la foto de mi fórmula.',
    );
  });

  it('codifica el mensaje y limpia el número', () => {
    const url = enlaceWhatsApp('+57 300 123 4567', '• 2 × Acetaminofén');
    expect(url).toBe('https://wa.me/573001234567?text=%E2%80%A2%202%20%C3%97%20Acetaminof%C3%A9n');
    expect(decodeURIComponent(new URL(url).searchParams.get('text')!)).toBe('• 2 × Acetaminofén');
  });

  it('muestra el número legible o un marcador si aún no es válido', () => {
    expect(numeroVisible('573001234567')).toBe('+57 300 123 4567');
    expect(numeroVisible('57')).toBe('+57 [número]');
  });

  it('sin mensaje, solo el número', () => {
    expect(enlaceWhatsApp('573001234567')).toBe('https://wa.me/573001234567');
  });
});
