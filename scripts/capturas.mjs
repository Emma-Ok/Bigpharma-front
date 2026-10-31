// Capturas de pantalla para revisar el diseño. Se corre en el contenedor de Playwright:
//   docker compose --profile pruebas run --rm pruebas node scripts/capturas.mjs / /catalogo
// Guarda en test-results/capturas/ (celular 390 px y escritorio 1440 px).
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://web:4321';
const rutas = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];
const tamanos = { celular: { width: 390, height: 844 }, escritorio: { width: 1440, height: 900 } };
const salida = 'test-results/capturas';
await mkdir(salida, { recursive: true });

const navegador = await chromium.launch();
for (const [nombre, viewport] of Object.entries(tamanos)) {
  const pagina = await navegador.newPage({ viewport, reducedMotion: 'reduce' });
  for (const ruta of rutas) {
    await pagina.goto(new URL(ruta, base).href, { waitUntil: 'networkidle' });
    const archivo = `${salida}/${nombre}${ruta.replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '') || '-inicio'}.png`;
    await pagina.screenshot({ path: archivo, fullPage: true });
    console.log(archivo);
  }
  await pagina.close();
}
await navegador.close();
