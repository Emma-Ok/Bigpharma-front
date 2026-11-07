import { expect, test, type Page } from '@playwright/test';

/** docs/MOVIMIENTO-Y-3D.md, sección 5. */

const CHUNKS_3D = /\/(hero|servicios|celebracion|motor|piezas|three)[.-]/;

async function scriptsDescargados(page: Page) {
  const urls: string[] = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') urls.push(r.url());
  });
  return urls;
}

test.describe('con movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('no hay ningún canvas, se ve la imagen estática y no se descarga three.js', async ({ page }) => {
    const scripts = await scriptsDescargados(page);
    for (const ruta of ['/', '/catalogo', '/producto/protector-solar-fps-50']) {
      await page.goto(ruta, { waitUntil: 'load' });
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
      await expect(page.locator('canvas')).toHaveCount(0);
    }
    await page.goto('/');
    await expect(page.locator('#inicio .imagen-estatica svg').locator('visible=true').first()).toBeVisible();
    expect(scripts.filter((u) => CHUNKS_3D.test(u))).toEqual([]);
  });
});

test.describe('con movimiento activo', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('en escritorio el canvas del hero está oculto a la accesibilidad y no recibe foco ni clics', async ({ page }, info) => {
    test.skip(info.project.name !== 'escritorio', 'Escritorio');
    await page.goto('/', { waitUntil: 'load' });
    await page.mouse.move(200, 200);
    const canvas = page.locator('#inicio canvas');
    await expect(canvas).toHaveCount(1, { timeout: 15_000 });
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas).toHaveAttribute('tabindex', '-1');
    expect(await canvas.evaluate((c) => getComputedStyle(c).pointerEvents)).toBe('none');
    const caja = (await page.locator('#hero-titulo').boundingBox())!;
    const encima = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.tagName,
      [caja.x + caja.width / 2, caja.y + caja.height / 2],
    );
    expect(encima).not.toBe('CANVAS');
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('CANVAS');
    }
  });

  test('three.js solo vive en la portada: hero y servicios sí, catálogo, ficha y 404 no', async ({ page }, info) => {
    test.skip(info.project.name !== 'escritorio', 'Escritorio');
    await page.goto('/', { waitUntil: 'load' });
    await page.mouse.move(200, 200);
    await expect(page.locator('[data-escena="hero"] canvas')).toHaveCount(1, { timeout: 15_000 });
    await page.locator('#servicios').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-escena="servicios"] canvas')).toHaveCount(1, { timeout: 15_000 });
    for (const ruta of ['/catalogo', '/producto/protector-solar-fps-50', '/no-existe']) {
      await page.goto(ruta, { waitUntil: 'load' });
      await page.mouse.move(220, 220);
      await page.waitForTimeout(800);
      await expect(page.locator('canvas')).toHaveCount(0);
    }
  });

  test('la escena 3D se carga con la primera interacción, no antes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await expect(page.locator('#inicio canvas')).toHaveCount(0);
    await expect(page.locator('#inicio .imagen-estatica svg').first()).toBeAttached();
    await page.mouse.wheel(0, 40);
    await expect(page.locator('#inicio canvas')).toHaveCount(1, { timeout: 15_000 });
  });

  test('el canvas va sobre la tarjeta y no le quita los clics', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.mouse.wheel(0, 1);
    await expect(page.locator('#inicio canvas')).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator('[data-escena="hero"]')).toHaveCSS('pointer-events', 'none');
  });
});

test('en 390×844 el título y un botón se ven sin hacer scroll', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'Celular');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const escenario = (await page.locator('[data-escena="hero"]').boundingBox())!;
  const titulo = (await page.locator('#hero-titulo').boundingBox())!;
  const boton = (await page.locator('#inicio a[href="/catalogo"]').boundingBox())!;
  expect(escenario.height).toBe(300);
  expect(titulo.y).toBeGreaterThan(escenario.y + escenario.height - 1);
  expect(boton.y + boton.height).toBeLessThanOrEqual(844);
});
