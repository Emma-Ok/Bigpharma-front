import { expect, test, type Page } from '@playwright/test';
import { conCarrito, sinViolaciones } from './utilidades';

const chipActual = (page: Page) => page.locator('[data-chip-anuncio="actual"]');
const indiceChip = (page: Page) => chipActual(page).evaluate((c) => [...c.parentElement!.children].indexOf(c));

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
  await expect(page.getByRole('button', { name: 'Piel y cuidado' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /^Filtros/ }).click();
  await page.getByRole('checkbox', { name: 'Solo productos con descuento' }).check();
  await expect(page).toHaveURL(/categoria=piel&descuento=1/);
  await page.getByRole('combobox', { name: 'Ordenar por' }).selectOption('nombre');
  await page.getByRole('button', { name: /^Ver \d+ productos?$/ }).click();
  await expect(page.getByRole('button', { name: 'Filtros (2)' })).toBeFocused();
});

test('la barra del pedido en celular solo aparece con productos, reserva su espacio y abre la hoja', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'Solo en celular');
  await page.goto('/catalogo');
  const barra = page.getByRole('button', { name: /Ver pedido/ });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(barra).toHaveCount(0);

  await conCarrito(page, [{ id: 'd1', cantidad: 1 }]);
  await page.goto('/catalogo');
  await expect(barra).toContainText('1 producto · $42.000');
  await expect(page.getByRole('progressbar', { name: 'Avance hacia el domicilio gratis' })).toHaveAttribute('aria-valuenow', '70');
  // La página reserva la altura de la barra: el final del pie no queda tapado.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const pie = (await page.locator('footer').boundingBox())!;
  const techo = (await page.locator('[data-contador-pedido]').locator('xpath=ancestor::div[contains(@class,"fixed")]').boundingBox())!;
  expect(pie.y + pie.height).toBeLessThanOrEqual(techo.y + 1);

  await barra.click();
  const hoja = page.getByRole('dialog', { name: 'Tu pedido' });
  await expect(hoja.getByText('Te faltan $18.000 para domicilio gratis')).toBeVisible();
  await expect(hoja.getByRole('region', { name: 'Vista previa del mensaje' })).toContainText('• 1 × Protector solar FPS 50: $42.000');
  await expect(hoja.getByRole('link', { name: 'Continuar con mis datos' })).toHaveAttribute('href', '/pedido');
  await page.keyboard.press('Escape');
  await expect(hoja).toBeHidden();
  await expect(barra).toBeFocused();

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('button', { name: 'Agregar al pedido: Crema humectante' }).click();
  await barra.click();
  await expect(hoja.getByText('Tu domicilio es gratis')).toBeVisible();
});

test('los productos con fórmula llevan «Enviar mi fórmula» en la tarjeta', async ({ page }) => {
  await page.goto('/catalogo?categoria=formula');
  const boton = page.getByRole('link', { name: 'Enviar mi fórmula: Amoxicilina 500 mg' });
  await expect(boton).toHaveAttribute('href', /^https:\/\/wa\.me\//);
  await expect(boton).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(boton).toHaveCSS('background-color', 'rgb(168, 98, 26)');
});

test('el panel del pedido lleva a /pedido sin enviar nada', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'El panel lateral es de escritorio');
  await conCarrito(page, [{ id: 'a1', cantidad: 2 }]);
  await page.goto('/catalogo');
  const panel = page.getByRole('complementary', { name: 'Tu pedido' });
  await expect(panel.getByRole('region', { name: 'Vista previa del mensaje' })).toHaveText(
    /Hola, quiero hacer este pedido:\s+• 2 × Acetaminofén 500 mg: \$7\.000\s+Subtotal: \$7\.000\s+Nombre: \[tu nombre\]\s+Dirección: \[tu barrio y dirección\]\s+Pago: \[tu forma de pago\]/,
  );
  await expect(panel.getByRole('link', { name: 'Enviar pedido por WhatsApp' })).toHaveCount(0);
  // El contorno de la vista previa solo aparece con teclado.
  const vista = panel.getByRole('region', { name: 'Vista previa del mensaje' });
  await vista.click();
  await expect(vista).toHaveCSS('outline-style', 'none');
  await panel.getByRole('link', { name: 'Continuar con mis datos' }).click();
  await expect(page).toHaveURL(/\/pedido$/);
  await expect(page.getByRole('button', { name: 'Enviar pedido por WhatsApp' })).toBeVisible();
});

for (const ancho of [360, 390, 768, 1024, 1440]) {
  test(`sin scroll horizontal a ${ancho} px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'escritorio', 'Se recorren los anchos una sola vez');
    await page.setViewportSize({ width: ancho, height: 800 });
    await conCarrito(page, [{ id: 'd1', cantidad: 1 }]);
    for (const ruta of ['/', '/catalogo', '/producto/acetaminofen-500-mg', '/pedido']) {
      await page.goto(ruta);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), ruta).toBeLessThanOrEqual(ancho);
    }
  });
}

test('el catálogo tiene 2 columnas hasta 599 px y 3 desde 600 px', async ({ page }) => {
  for (const [ancho, columnas] of [[599, 2], [600, 3], [1440, 3]] as const) {
    await page.setViewportSize({ width: ancho, height: 800 });
    await page.goto('/catalogo');
    const pistas = await page.locator('#resultados ul').first().evaluate((u) => getComputedStyle(u).gridTemplateColumns.split(' ').length);
    expect(pistas).toBe(columnas);
  }
});

test('debajo de 1200 px la búsqueda sigue visible al bajar por el catálogo', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'Celular');
  await page.goto('/catalogo');
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(async () => (await page.locator('#q-catalogo').boundingBox())!.y).toBeLessThan(40);
});

test('aplicar un filtro no dispara una transición sobre la hoja', async ({ page }) => {
  // Las transiciones se pintan por encima del diálogo: las tarjetas se verían encima de la hoja.
  await page.addInitScript(() => {
    const w = window as unknown as { __transiciones: number };
    w.__transiciones = 0;
    const original = document.startViewTransition?.bind(document);
    if (original) {
      document.startViewTransition = ((...args: Parameters<typeof original>) => {
        w.__transiciones++;
        return original(...args);
      }) as typeof document.startViewTransition;
    }
  });
  await page.goto('/catalogo');
  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="Catalogo"][ssr]'));
  await page.getByRole('button', { name: /^Filtros/ }).click();
  const hoja = page.getByRole('dialog', { name: 'Filtros' });
  await hoja.getByRole('checkbox', { name: 'Solo productos con descuento' }).check();
  await hoja.getByRole('radio', { name: 'Medicamento' }).check();
  await hoja.getByRole('combobox', { name: 'Ordenar por' }).selectOption('nombre');
  await hoja.getByRole('button', { name: 'Borrar filtros' }).click();
  expect(await page.evaluate(() => (window as unknown as { __transiciones: number }).__transiciones)).toBe(0);
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
  const carrusel = page.getByRole('region', { name: 'Anuncios principales' });
  // Sin flechas ni botón de pausa: solo chips de posición.
  await expect(carrusel.getByRole('button')).toHaveCount(0);
  await expect(page.locator('[data-chip-anuncio], [aria-label="Anuncios principales"] [aria-hidden] > span')).toHaveCount(3);
  await carrusel.getByRole('link').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(chipActual(page)).toHaveCount(1);
  expect(await indiceChip(page)).toBe(1);
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
  await expect.poll(() => indiceChip(page)).toBe(1);
  await expect(page).toHaveURL(/\/$/);
});

test('los carruseles avanzan solos y no tienen botón de pausa', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="CarruselAnuncios"][ssr]'));
  await page.mouse.move(5, 600);
  const avisoActivo = () =>
    page.evaluate(() => [...document.querySelector('[data-aviso-pista]')!.children].findIndex((c) => !(c as HTMLElement).inert));
  await expect(page.locator('[data-avisos]').getByRole('button')).toHaveCount(0);
  expect(await avisoActivo()).toBe(0);
  await page.clock.runFor(6100);
  await expect.poll(avisoActivo).toBe(1);
  await expect.poll(() => indiceChip(page)).toBe(1);
  await page.clock.runFor(6100);
  await expect.poll(avisoActivo).toBe(2);
});

test('la barra de avisos se detiene con el puntero encima', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'Puntero');
  await page.clock.install();
  await page.goto('/');
  const avisoActivo = () =>
    page.evaluate(() => [...document.querySelector('[data-aviso-pista]')!.children].findIndex((c) => !(c as HTMLElement).inert));
  await page.locator('[data-avisos]').hover();
  await page.clock.runFor(13000);
  expect(await avisoActivo()).toBe(0);
});

test('en celular el WhatsApp de los avisos no se ve', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'Celular');
  await page.goto('/');
  await expect(page.locator('[data-avisos]').getByRole('link')).toBeHidden();
});

test('ir de la portada al catálogo no hace viajar los productos; hacia una ficha sí', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const w = window as unknown as { __marcas: boolean[] };
    w.__marcas = [];
    document.addEventListener('astro:before-swap', () => w.__marcas.push(document.documentElement.hasAttribute('data-vt-producto')));
  });
  await page.locator('#catalogo').getByRole('link', { name: 'Ver todos los productos' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  expect(await page.evaluate(() => (window as unknown as { __marcas: boolean[] }).__marcas)).toEqual([false]);
  await page.goto('/producto/acetaminofen-500-mg');
  await page.evaluate(() => {
    const w = window as unknown as { __marcas: boolean[] };
    w.__marcas = [];
    document.addEventListener('astro:before-swap', () => w.__marcas.push(document.documentElement.hasAttribute('data-vt-producto')));
  });
  await page.getByRole('navigation', { name: /ruta|migas/i }).getByRole('link', { name: 'Catálogo' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  expect(await page.evaluate(() => (window as unknown as { __marcas: boolean[] }).__marcas)).toEqual([true]);
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
  await expect(page.getByRole('heading', { level: 1, name: 'Catálogo' })).toBeVisible();
});
