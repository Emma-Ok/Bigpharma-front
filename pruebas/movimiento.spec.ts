import { expect, test } from '@playwright/test';

/** docs/MOVIMIENTO-Y-3D.md, sección 5. */

test.describe('con movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('no hay canvas, se ve la imagen estática y no se descarga three.js', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'script') scripts.push(r.url());
    });
    await page.goto('/', { waitUntil: 'load' });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await page.waitForTimeout(2500);
    await expect(page.locator('#inicio canvas')).toHaveCount(0);
    await expect(page.locator('.capsulas-estaticas svg')).toBeVisible();
    expect(scripts.filter((u) => /capsulas/.test(u))).toEqual([]);
  });
});

test.describe('con movimiento activo', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('en escritorio el canvas existe, está oculto a la accesibilidad y no recibe foco ni clics', async ({ page }, info) => {
    test.skip(info.project.name !== 'escritorio', 'La escena solo se carga en escritorio');
    await page.goto('/', { waitUntil: 'load' });
    const canvas = page.locator('#inicio canvas');
    await expect(canvas).toHaveCount(1, { timeout: 15_000 });
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas).toHaveAttribute('tabindex', '-1');
    expect(await canvas.evaluate((c) => getComputedStyle(c).pointerEvents)).toBe('none');
    // El clic en el titular llega al texto, no al canvas.
    const caja = (await page.locator('#hero-titulo').boundingBox())!;
    const encima = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.tagName,
      [caja.x + caja.width / 2, caja.y + caja.height / 2],
    );
    expect(encima).not.toBe('CANVAS');
    // Con Tab nunca se llega al canvas.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('CANVAS');
    }
  });

  test('en celular no se carga la escena 3D', async ({ page }, info) => {
    test.skip(info.project.name !== 'celular', 'Solo en celular');
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await expect(page.locator('#inicio canvas')).toHaveCount(0);
    await expect(page.locator('.capsulas-estaticas svg')).toBeAttached();
  });
});
