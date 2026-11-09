// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import cloudflare from '@astrojs/cloudflare';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
// Un sitio público sin SITIO_URL publicaría la URL canónica y el sitemap con un dominio que no es el suyo.
if (env.SITIO_PUBLICO === 'si' && !env.SITIO_URL) {
  throw new Error('SITIO_PUBLICO=si necesita SITIO_URL (la URL pública del sitio, sin barra al final).');
}
const site = env.SITIO_URL || 'https://drogueria.example';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },
  server: { host: '0.0.0.0', port: 4321 },
  integrations: [
    preact(),
    sitemap({
      filter: (pagina) => !pagina.includes('/pedido'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // El contenedor de pruebas llega al servidor de desarrollo como http://web:4321.
      allowedHosts: ['web'],
      // En Docker Desktop los eventos del sistema de archivos no siempre cruzan el volumen.
      watch: env.VIGILAR_CON_SONDEO === '1' ? { usePolling: true, interval: 300 } : undefined,
    },
  },
  // Todo el sitio es estático y se genera con Node (lee datos/*.csv con node:fs);
  // workerd queda para lo que algún día se sirva bajo demanda en Cloudflare Workers.
  // Sin sesiones ni Cloudflare Images: el sitio no los usa y así el despliegue no pide un KV ni el binding IMAGES.
  session: false,
  adapter: cloudflare({ prerenderEnvironment: 'node', imageService: 'passthrough' }),
});
