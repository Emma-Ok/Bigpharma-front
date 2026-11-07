import { expect, test } from '@playwright/test';
import { conCarrito, sinViolaciones } from './utilidades';

const RUTAS = ['/', '/catalogo', '/producto/acetaminofen-500-mg', '/producto/amoxicilina-500-mg', '/pedido'];

for (const movimiento of ['no-preference', 'reduce'] as const) {
  test.describe(`axe con movimiento ${movimiento === 'reduce' ? 'reducido' : 'activo'}`, () => {
    test.use({ contextOptions: { reducedMotion: movimiento } });

    for (const ruta of RUTAS) {
      test(`${ruta} no tiene violaciones`, async ({ page }) => {
        await page.goto('/robots.txt');
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(movimiento === 'reduce');
        await conCarrito(page, [
          { id: 'a1', cantidad: 2 },
          { id: 'c1', cantidad: 1 },
        ]);
        await page.goto(ruta);
        await expect(page.locator('h1')).toHaveCount(1);
        await sinViolaciones(page, ruta);
      });
    }

    test('el buscador abierto no tiene violaciones', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Busca por nombre o síntoma' }).click();
      const dialogo = page.getByRole('dialog', { name: 'Buscar productos' });
      await expect(dialogo).toBeVisible();
      await page.getByLabel('Busca por nombre o síntoma').fill('dolor');
      await expect(dialogo.getByText(/Resultados para «dolor»/)).toBeVisible();
      await sinViolaciones(page, 'buscador');
    });

    test('los filtros abiertos no tienen violaciones', async ({ page }) => {
      await page.goto('/catalogo');
      await page.getByRole('button', { name: /^Filtros/ }).click();
      await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible();
      await sinViolaciones(page, 'filtros');
    });

    test('la hoja del pedido no tiene violaciones', async ({ page }, info) => {
      test.skip(info.project.name !== 'celular', 'La hoja es de celular');
      await page.goto('/robots.txt');
      await conCarrito(page, [{ id: 'a1', cantidad: 2 }]);
      await page.goto('/catalogo');
      await page.getByRole('button', { name: /Ver pedido/ }).click();
      await expect(page.getByRole('dialog', { name: 'Tu pedido' })).toBeVisible();
      await sinViolaciones(page, 'hoja del pedido');
    });

    test('la vista rápida no tiene violaciones', async ({ page }) => {
      await page.goto('/catalogo');
      await page.getByRole('link', { name: 'Protector solar FPS 50' }).click();
      await expect(page.getByRole('dialog', { name: 'Protector solar FPS 50' })).toBeVisible();
      await sinViolaciones(page, 'vista rápida');
    });
  });
}

test('cada página tiene title, description, canónica y un solo h1', async ({ page }) => {
  for (const ruta of RUTAS) {
    await page.goto(ruta);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.title()).not.toBe('');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\//);
  }
  await page.goto('/pedido');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
