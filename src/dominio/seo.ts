import { urlProducto, type Producto } from './producto';
import type { Configuracion } from './sitio';

const absoluta = (ruta: string, sitio: URL | string) => new URL(ruta, sitio).href;

export interface Miga {
  nombre: string;
  ruta: string;
}

export function migasJsonLd(migas: Miga[], sitio: URL | string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: migas.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: m.nombre,
      item: absoluta(m.ruta, sitio),
    })),
  };
}

const DISPONIBILIDAD = {
  disponible: 'https://schema.org/InStock',
  pocas: 'https://schema.org/LimitedAvailability',
  agotado: 'https://schema.org/OutOfStock',
} as const;

/** Solo para venta libre: los medicamentos con fórmula no llevan Product/Offer. */
export function productoJsonLd(p: Producto, sitio: URL | string) {
  if (p.condicionVenta !== 'libre') return null;
  const url = absoluta(urlProducto(p), sitio);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nombre,
    sku: p.id,
    url,
    description: `${p.nombre}, ${p.presentacion}`,
    brand: { '@type': 'Brand', name: p.laboratorioMarca },
    ...(p.fotos.length ? { image: p.fotos.map((f) => absoluta(f, sitio)) } : {}),
    offers: {
      '@type': 'Offer',
      url,
      price: p.precio,
      priceCurrency: 'COP',
      availability: DISPONIBILIDAD[p.disponibilidad],
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function farmaciaJsonLd(c: Configuracion, sitio: URL | string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Pharmacy',
    name: c.nombreDrogueria,
    url: absoluta('/', sitio),
    telephone: `+${c.whatsapp}`,
    areaServed: c.zonasCobertura,
    image: absoluta(c.profesional.foto ?? '/og.png', sitio),
    paymentAccepted: 'Nequi, Llave Bre-B, tarjetas, efectivo',
    currenciesAccepted: 'COP',
  };
}
