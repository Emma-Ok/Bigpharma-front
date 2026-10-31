// Mide LCP (y qué elemento es) y el JS que descarga la portada, en celular (4G lento + CPU ×4) y escritorio.
// Se corre en el contenedor de Playwright contra el build de producción:
//   docker compose --profile pruebas run --rm pruebas sh -c "npm run build && (npx astro preview --port 4322 &) && sleep 3 && node scripts/medir.mjs"
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const base = process.env.MEDIR_URL ?? 'http://127.0.0.1:4322';
const ruta = process.argv[2] ?? '/';

const perfiles = {
  celular: {
    contexto: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    red: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
    cpu: 4,
  },
  escritorio: { contexto: { viewport: { width: 1440, height: 900 } }, red: null, cpu: 1 },
};

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [nombre, perfil] of Object.entries(perfiles)) {
  const contexto = await navegador.newContext(perfil.contexto);
  const pagina = await contexto.newPage();
  const cdp = await contexto.newCDPSession(pagina);
  if (perfil.red) {
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...perfil.red });
  }
  if (perfil.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: perfil.cpu });

  const scripts = [];
  pagina.on('response', async (r) => {
    if (r.request().resourceType() !== 'script') return;
    try {
      const cuerpo = await r.body();
      scripts.push({ url: r.url(), gzip: gzipSync(cuerpo).length, esThree: cuerpo.includes('WebGLRenderer') });
    } catch {}
  });
  await pagina.addInitScript(() => {
    window.__lcp = [];
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) {
        const el = e.element;
        const desc = el ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} «${(el.textContent ?? '').trim().slice(0, 30)}»` : '?';
        window.__lcp.push({ ms: Math.round(e.startTime), elemento: desc });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  await pagina.goto(new URL(ruta, base).href, { waitUntil: 'load' });
  await pagina.waitForTimeout(6000);
  const lcp = await pagina.evaluate(() => window.__lcp.at(-1));
  const cls = await pagina.evaluate(
    () =>
      new Promise((r) => {
        let total = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) total += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => r(Math.round(total * 1000) / 1000), 100);
      }),
  );
  const canvas = await pagina.locator('[data-escena] canvas').count();
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  const sinThree = scripts.filter((s) => !s.esThree).reduce((n, s) => n + s.gzip, 0);
  const three = scripts.filter((s) => s.esThree).reduce((n, s) => n + s.gzip, 0);
  console.log(`\n== ${nombre}`);
  console.log(`LCP: ${lcp?.ms} ms, elemento: ${lcp?.elemento}`);
  console.log(`CLS: ${cls}`);
  console.log(`JS sin three (gzip): ${kb(sinThree)} en ${scripts.filter((s) => !s.esThree).length} archivos`);
  console.log(`Chunk de three (gzip): ${three ? kb(three) : 'no se descargó'}; canvas en el hero: ${canvas}`);
  await contexto.close();
}
await navegador.close();
