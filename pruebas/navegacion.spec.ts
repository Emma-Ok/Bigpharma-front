import { expect, test, type Page } from '@playwright/test';
import { conCarrito } from './utilidades';

const FICHA = '/producto/acetaminofen-500-mg';

/** Enlace «volver» de celular: el que está visible dentro de la ruta de navegación. */
const volver = (page: Page) => page.getByRole('navigation', { name: 'Ruta de navegación' }).locator('a:has([data-volver-nombre])');

async function alto(page: Page) {
  const caja = await volver(page).boundingBox();
  return caja?.height ?? 0;
}

test.describe('en celular', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'celular', 'El enlace «volver» es de celular');
  });

  test('la ficha abierta desde fuera lleva al catálogo sin filtros, sin usar el historial', async ({ page }) => {
    await page.goto(FICHA);
    const enlace = page.getByRole('link', { name: 'Volver a Catálogo' });
    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute('href', '/catalogo');
    expect(await alto(page)).toBeGreaterThanOrEqual(44);
    // La ruta completa no se ve en celular.
    await expect(
      page.getByRole('navigation', { name: 'Ruta de navegación' }).getByRole('link', { name: 'Inicio', exact: true }),
    ).toBeHidden();
    await enlace.click();
    await expect(page).toHaveURL(/\/catalogo$/);
  });

  test('desde una categoría con búsqueda, la ficha nombra la categoría y vuelve con los filtros', async ({ page }) => {
    await page.goto('/catalogo?q=acetaminofen&categoria=dolor&descuento=0');
    await expect(page.getByRole('button', { name: /Dolor y fiebre/, pressed: true })).toBeVisible();
    await expect(page.locator('#q-catalogo')).toHaveValue('acetaminofen');
    // La vista rápida lleva a la página completa.
    await page.getByRole('heading', { name: 'Acetaminofén 500 mg' }).getByRole('link').click();
    await page.getByRole('link', { name: 'Ver la página completa del producto' }).click();
    await expect(page).toHaveURL(new RegExp(`${FICHA}$`));

    const enlace = page.getByRole('link', { name: 'Volver a Dolor y fiebre' });
    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute('href', '/catalogo?q=acetaminofen&categoria=dolor');

    // Recargar la ficha conserva el origen.
    await page.reload();
    await expect(page.getByRole('link', { name: 'Volver a Dolor y fiebre' })).toBeVisible();

    await page.getByRole('link', { name: 'Volver a Dolor y fiebre' }).click();
    await expect(page).toHaveURL(/\/catalogo\?q=acetaminofen&categoria=dolor$/);
    await expect(page.locator('#q-catalogo')).toHaveValue('acetaminofen');
    await expect(page.getByRole('button', { name: /Dolor y fiebre/, pressed: true })).toBeVisible();
  });

  test('si se llega a la ficha desde la portada, el enlace no nombra la categoría vista antes', async ({ page }) => {
    await page.goto('/catalogo?categoria=piel');
    await expect(page.getByRole('button', { name: /Piel y cuidado/, pressed: true })).toBeVisible();
    await page.goto('/');
    await page.goto(FICHA);
    await expect(page.getByRole('link', { name: 'Volver a Catálogo' })).toBeVisible();
  });

  test('en el pedido, «Seguir comprando» vuelve al catálogo como quedó', async ({ page }) => {
    await conCarrito(page, [{ id: 'a1', cantidad: 1 }]);
    await page.goto('/pedido');
    const enlace = page.getByRole('navigation', { name: 'Ruta de navegación' }).getByRole('link', { name: 'Seguir comprando' });
    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute('href', '/catalogo');
    expect(await alto(page)).toBeGreaterThanOrEqual(44);

    await page.goto('/catalogo?categoria=bebes&orden=precio-asc');
    await expect(page.getByRole('button', { name: /Bebés/, pressed: true })).toBeVisible();
    await page.goto('/pedido');
    // El de arriba y el del resumen del pedido.
    for (const enlace of await page.getByRole('link', { name: 'Seguir comprando' }).all()) {
      await expect(enlace).toHaveAttribute('href', '/catalogo?categoria=bebes&orden=precio-asc');
    }
  });

  test('el catálogo vuelve al inicio', async ({ page }) => {
    await page.goto('/catalogo');
    const enlace = page.getByRole('link', { name: 'Volver a Inicio' });
    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute('href', '/');
  });
});

test.describe('en escritorio', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'escritorio', 'La ruta completa es de escritorio');
  });

  test('la ficha y el pedido muestran la ruta completa y no el enlace de celular', async ({ page }) => {
    await page.goto(FICHA);
    const ruta = page.getByRole('navigation', { name: 'Ruta de navegación' });
    await expect(ruta.getByRole('link', { name: 'Inicio' })).toBeVisible();
    await expect(ruta.getByRole('link', { name: 'Catálogo', exact: true })).toBeVisible();
    await expect(ruta.getByRole('link', { name: 'Dolor y fiebre' })).toBeVisible();
    await expect(ruta.getByText('Acetaminofén 500 mg')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('link', { name: 'Volver a Catálogo' })).toBeHidden();

    await page.goto('/pedido');
    await expect(ruta.getByRole('link', { name: 'Inicio' })).toBeVisible();
    await expect(ruta.getByText('Tu pedido')).toHaveAttribute('aria-current', 'page');
    await expect(ruta.getByRole('link', { name: 'Seguir comprando' })).toBeHidden();
  });

  test('la ruta se recorre con el teclado', async ({ page }) => {
    await page.goto(FICHA);
    const inicio = page.getByRole('navigation', { name: 'Ruta de navegación' }).getByRole('link', { name: 'Inicio' });
    for (let i = 0; i < 40 && !(await inicio.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(inicio).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('navigation', { name: 'Ruta de navegación' }).getByRole('link', { name: 'Catálogo', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/catalogo$/);
  });
});
