import { expect, test } from '@playwright/test';
import { conCarrito, sinViolaciones } from './utilidades';

test('un medicamento con fórmula no muestra precio ni se agrega al pedido', async ({ page }) => {
  await page.goto('/producto/amoxicilina-500-mg');
  await expect(page.getByRole('heading', { level: 1, name: 'Amoxicilina 500 mg' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/\$\d/);
  await expect(page.getByRole('button', { name: /Agregar/ })).toHaveCount(0);
  const enlace = page.getByRole('link', { name: 'Enviar fórmula por WhatsApp' });
  await expect(enlace).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/\d*\?text=Hola%2C%20quiero%20consultar%20por%20Amoxicilina%20500%20mg\.%20Te%20env%C3%ADo%20la%20foto%20de%20mi%20f%C3%B3rmula\.$/,
  );
  await expect(page.getByText('Este medicamento requiere fórmula médica.')).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').allTextContents()).not.toContainEqual(
    expect.stringContaining('"Offer"'),
  );
});

test('un medicamento de venta libre muestra la leyenda y su JSON-LD Product', async ({ page }) => {
  await page.goto('/producto/acetaminofen-500-mg');
  await expect(page.getByText('Si los síntomas persisten, consulte a su médico.').first()).toBeVisible();
  await expect(page.getByText('Precio por unidad: $350 por tableta')).toBeVisible();
  const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join('');
  expect(jsonLd).toContain('"@type":"Product"');
  expect(jsonLd).toContain('"price":3500');
  expect(jsonLd).toContain('"@type":"BreadcrumbList"');
});

test('el catálogo aplica el filtro de la URL', async ({ page }) => {
  await page.goto('/catalogo?categoria=piel');
  await expect(page.getByText('Mostrando 1–2 de 2 productos')).toBeVisible();
  if (test.info().project.name === 'celular') await page.getByRole('button', { name: /^Filtros/ }).click();
  await expect(page.getByRole('radio', { name: /Piel y cuidado/ })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Solo productos con descuento' }).check();
  await expect(page).toHaveURL(/categoria=piel&descuento=1/);
});

test('la barra del pedido en celular muestra el avance hacia el domicilio gratis', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'Solo en celular');
  await conCarrito(page, [{ id: 'd1', cantidad: 1 }]);
  await page.goto('/catalogo');
  await expect(page.getByText('1 producto, $42.000')).toBeVisible();
  await expect(page.getByText('Te faltan $18.000 para el domicilio gratis')).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Avance hacia el domicilio gratis' })).toHaveAttribute('aria-valuenow', '70');
  await page.getByRole('button', { name: 'Agregar al pedido: Crema humectante' }).click();
  await expect(page.getByText('Tu domicilio es gratis')).toBeVisible();
});

test('un producto agotado ofrece preguntar disponibilidad', async ({ page }) => {
  await page.goto('/catalogo?categoria=bebes');
  await expect(page.getByRole('link', { name: 'Preguntar disponibilidad por WhatsApp: Crema antipañalitis' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agregar al pedido: Crema antipañalitis' })).toHaveCount(0);
});

test('vaciar el pedido pide confirmación y deja el pedido vacío', async ({ page }) => {
  await conCarrito(page, [
    { id: 'a1', cantidad: 2 },
    { id: 'c1', cantidad: 1 },
  ]);
  await page.goto('/pedido');
  await expect(page.getByRole('heading', { name: '3 productos' })).toBeVisible();

  await page.getByRole('button', { name: 'Vaciar pedido' }).click();
  await expect(page.getByRole('group', { name: '¿Quitar todos los productos de tu pedido?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await sinViolaciones(page, 'confirmación de vaciar');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Vaciar pedido' })).toBeFocused();
  await expect(page.getByRole('heading', { name: '3 productos' })).toBeVisible();

  await page.getByRole('button', { name: 'Vaciar pedido' }).click();
  await page.getByRole('button', { name: 'Sí, vaciar' }).click();
  await expect(page.getByText('Tu pedido está vacío')).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('carrito:v1'))).toBe('[]');
});

test('el panel del pedido de la portada también se puede vaciar', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'El panel lateral es de escritorio');
  await conCarrito(page, [{ id: 'd1', cantidad: 1 }]);
  await page.goto('/');
  const panel = page.getByRole('complementary', { name: 'Tu pedido' });
  await expect(panel.getByText('Protector solar FPS 50')).toBeVisible();
  await panel.getByRole('button', { name: 'Vaciar pedido' }).click();
  await panel.getByRole('button', { name: 'Sí, vaciar' }).click();
  await expect(panel.getByText('Aún no tienes productos.')).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Tu pedido' })).toBeFocused();
});

test('los anuncios funcionan como carrusel', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="CarruselAnuncios"][ssr]'));
  await page.getByRole('button', { name: 'Anuncio siguiente' }).click();
  await expect(page.getByRole('button', { name: 'Ver anuncio 2 de 3' })).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('group', { name: 'Anuncio 2 de 3' })).not.toHaveAttribute('inert');
  await expect(page.getByRole('group', { name: 'Anuncio 1 de 3', includeHidden: true })).toHaveAttribute('inert', '');
});

test('al abrir la vista rápida solo la imagen elegida tiene nombre de transición', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'Escritorio');
  await page.goto('/catalogo');
  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="Catalogo"][ssr]'));
  // Durante la transición de tipo «ficha», ninguna otra tarjeta debe pintarse encima del fondo.
  const nombres = await page.evaluate(async () => {
    const enlace = [...document.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Protector solar FPS 50')!;
    enlace.click();
    await new Promise((r) => setTimeout(r, 30));
    const conNombre = [...document.querySelectorAll('[data-vt], [data-vt-tarjeta]')]
      .map((e) => getComputedStyle(e).viewTransitionName)
      .filter((n) => n && n !== 'none');
    return { activa: document.documentElement.matches(':active-view-transition'), conNombre };
  });
  if (nombres.activa) expect(nombres.conNombre).toEqual(['producto-d1-foto']);
  await expect(page.getByRole('dialog', { name: 'Protector solar FPS 50' })).toBeVisible();
});

test('el carrusel de anuncios se desliza con el gesto', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="CarruselAnuncios"][ssr]'));
  const pista = page.locator('[aria-label="Anuncios principales"] .carrusel-pista');
  await pista.scrollIntoViewIfNeeded();
  const caja = (await pista.boundingBox())!;
  const y = caja.y + caja.height / 2;
  await page.mouse.move(caja.x + caja.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(caja.x + caja.width * 0.2, y, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Ver anuncio 2 de 3' })).toHaveAttribute('aria-current', 'true');
  await expect(page).toHaveURL(/\/$/);
});

test('los carruseles avanzan solos y se pueden pausar', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="CarruselAnuncios"][ssr]'));
  await page.mouse.move(5, 600);
  const avisoActivo = () =>
    page.evaluate(() => [...document.querySelector('[data-aviso-pista]')!.children].findIndex((c) => !(c as HTMLElement).inert));
  expect(await avisoActivo()).toBe(0);
  await page.clock.runFor(6100);
  await expect.poll(avisoActivo).toBe(1);
  await expect(page.getByRole('button', { name: 'Ver anuncio 2 de 3' })).toHaveAttribute('aria-current', 'true');

  await page.getByRole('button', { name: 'Pausar avisos' }).click();
  await expect(page.getByRole('button', { name: 'Reanudar avisos' })).toBeVisible();
  await page.mouse.move(5, 600);
  await page.clock.runFor(13000);
  expect(await avisoActivo()).toBe(1);

  // El foco que deja el clic no impide reanudar.
  await page.getByRole('button', { name: 'Reanudar avisos' }).click();
  await page.mouse.move(5, 600);
  await page.clock.runFor(6100);
  await expect.poll(avisoActivo).toBe(2);
});

test('la barra de avisos no muestra flechas ni puntos y se pausa con el puntero y el foco', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'Puntero y teclado');
  await page.clock.install();
  await page.goto('/');
  const barra = page.locator('[data-avisos]');
  const boton = page.getByRole('button', { name: 'Pausar avisos' });
  await expect(barra.getByRole('button')).toHaveCount(1);
  const avisoActivo = () =>
    page.evaluate(() => [...document.querySelector('[data-aviso-pista]')!.children].findIndex((c) => !(c as HTMLElement).inert));

  // El botón solo aparece con hover o foco.
  await page.mouse.move(5, 600);
  await expect(boton).toHaveCSS('opacity', '0');
  await barra.hover();
  await expect(boton).toHaveCSS('opacity', '1');
  await page.clock.runFor(13000);
  expect(await avisoActivo()).toBe(0);

  await page.mouse.move(5, 600);
  await barra.getByRole('link').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(boton).toBeFocused();
  await expect(boton).toHaveCSS('opacity', '1');
  await page.clock.runFor(13000);
  expect(await avisoActivo()).toBe(0);
});

test('en celular el botón de pausa siempre se ve y el WhatsApp de los avisos no', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'Celular');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Pausar avisos' })).toHaveCSS('opacity', '1');
  const caja = await page.getByRole('button', { name: 'Pausar avisos' }).boundingBox();
  expect(Math.min(caja!.width, caja!.height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator('[data-avisos]').getByRole('link')).toBeHidden();
});

test.describe('con movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('la barra de avisos deja fijo el primer mensaje', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await page.mouse.move(5, 600);
    await page.clock.runFor(13000);
    const activo = await page.evaluate(() =>
      [...document.querySelector('[data-aviso-pista]')!.children].findIndex((c) => !(c as HTMLElement).inert),
    );
    expect(activo).toBe(0);
    await expect(page.locator('[data-aviso-pausa]')).toBeHidden();
  });
});

test('en celular el menú y los filtros se superponen y se cierran con Esc', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'Celular');
  await page.goto('/catalogo');
  const contenido = page.getByRole('heading', { level: 1 });
  const antes = (await contenido.boundingBox())!.y;
  await page.getByRole('button', { name: 'Menú' }).click();
  await expect(page.locator('#menu-movil')).toBeVisible();
  expect((await contenido.boundingBox())!.y).toBe(antes);
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-movil')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Menú' })).toBeFocused();

  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="Catalogo"][ssr]'));
  const resultados = page.locator('#resultados');
  const y = (await resultados.boundingBox())!.y;
  await page.getByRole('button', { name: /^Filtros/ }).click();
  await expect(page.locator('#panel-filtros')).toBeVisible();
  expect((await resultados.boundingBox())!.y).toBe(y);
  await page.keyboard.press('Escape');
  await expect(page.locator('#panel-filtros')).toBeHidden();
  await expect(page.getByRole('button', { name: /^Filtros/ })).toBeFocused();
});

test('«Ver catálogo» del inicio lleva a la página del catálogo', async ({ page }) => {
  await page.goto('/');
  await page.locator('#inicio').getByRole('link', { name: 'Ver catálogo' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Catálogo de productos' })).toBeVisible();
});
