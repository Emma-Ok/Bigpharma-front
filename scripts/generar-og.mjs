// Imagen para compartir el sitio (og:image, 1200×630): la vista previa que se ve al pegar el enlace en WhatsApp.
// Toma el nombre, la cobertura y el domicilio gratis de datos/configuracion.csv. Si cambian en la hoja, se vuelve a generar:
//   docker compose --profile pruebas run --rm pruebas node scripts/generar-og.mjs
// Escribe public/og.png.
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const csv = await readFile('datos/configuracion.csv', 'utf8');
const config = Object.fromEntries(
  csv
    .split('\n')
    .slice(1)
    .map((linea) => linea.match(/^([^,]+),("(?:[^"]|"")*"|[^,]*)/))
    .filter(Boolean)
    .map(([, clave, valor]) => [clave, valor.replace(/^"|"$/g, '').replace(/""/g, '"')]),
);
const nombre = config.nombre_drogueria;
const zona = config.zonas_cobertura ?? '';
// Igual que profesionConArticulo (src/dominio/sitio.ts): «un químico farmacéutico».
const oficio = (config.profesional_profesion ?? '').trim().toLowerCase();
const profesion = !oficio || oficio.startsWith('[') ? 'un químico farmacéutico' : `${oficio.split(/\s+/)[0].endsWith('a') ? 'una' : 'un'} ${oficio}`;
const gratis = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
  Number(config.domicilio_gratis_desde),
).replace(/\s/g, '');
if (!nombre || nombre.startsWith('[')) throw new Error('Falta nombre_drogueria en datos/configuracion.csv');

const fuente = (await readFile('node_modules/@fontsource-variable/lexend/files/lexend-latin-wght-normal.woff2')).toString('base64');
const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Colores: tokens de src/styles/global.css (bottle, celadon, paper, amber).
const html = `<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><style>
@font-face { font-family: Lexend; src: url(data:font/woff2;base64,${fuente}) format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #133B34; color: #F3F5F1; font-family: Lexend, sans-serif; overflow: hidden; position: relative; }
.texto { position: absolute; inset: 72px auto 72px 80px; width: 780px; display: flex; flex-direction: column; gap: 26px; }
.marca { display: flex; align-items: center; gap: 22px; font-size: 40px; font-weight: 600; }
.marca span { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 20px; background: #F3F5F1; }
h1 { font-size: 54px; line-height: 1.1; font-weight: 600; letter-spacing: -0.01em; }
p { font-size: 28px; line-height: 1.35; color: #D5E5DB; }
.pie { margin-top: auto; display: flex; gap: 16px; }
.pie b { white-space: nowrap; font-weight: 600; font-size: 26px; padding: 14px 24px; border-radius: 14px; background: #D5E5DB; color: #133B34; }
.pie b.ambar { background: #A8621A; color: #FFFFFF; }
svg.jeringa { position: absolute; right: -70px; top: 60px; width: 440px; height: 440px; }
</style></head><body>
<div class="texto">
  <div class="marca"><span><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#133B34" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg></span>${escapar(nombre)}</div>
  <h1>Tus medicamentos a domicilio, revisados por ${escapar(profesion)}</h1>
  <p>En ${escapar(zona)}. Pide por WhatsApp.</p>
  <div class="pie"><b>Domicilio gratis desde ${escapar(gratis)}</b><b class="ambar">Inyectología en casa</b></div>
</div>
<!-- Jeringa: ícono «syringe» de Lucide (lucide.dev), licencia ISC. -->
<svg class="jeringa" viewBox="0 0 24 24" fill="none" stroke="#D5E5DB" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>
</body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html, { waitUntil: 'load' });
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: 'public/og.png' });
await navegador.close();
console.log('public/og.png');
