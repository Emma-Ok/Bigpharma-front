import type { APIRoute } from 'astro';
import { sitioPublico } from '@/hoja/cargarDatos';

/**
 * Sin SITIO_PUBLICO=si no se bloquea el rastreo: así los buscadores leen el noindex de cada página
 * (una URL bloqueada en robots.txt puede quedar indexada sin contenido si alguien la enlaza).
 */
export const GET: APIRoute = ({ site }) =>
  new Response(
    (sitioPublico()
      ? ['User-agent: *', 'Disallow: /pedido', '', `Sitemap: ${new URL('/sitemap-index.xml', site).href}`, '']
      : ['User-agent: *', 'Disallow:', '']
    ).join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
