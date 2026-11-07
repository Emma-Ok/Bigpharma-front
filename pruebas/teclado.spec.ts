import { expect, test } from '@playwright/test';
import { capturarVentanas, tabularHasta, ventanasAbiertas } from './utilidades';

test.use({ viewport: { width: 1440, height: 900 } });

test('el pedido completo se puede hacer solo con teclado', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'El recorrido con teclado se prueba en escritorio');
  await capturarVentanas(page);
  await page.goto('/catalogo');

  // Saltar al contenido.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenido')).toBeFocused();

  // Agregar Acetaminofén: el foco pasa al botón «+» que reemplaza a «Agregar».
  await tabularHasta(page, { etiqueta: 'Agregar al pedido: Acetaminofén 500 mg' });
  await page.keyboard.press('Enter');
  const mas = page.getByRole('button', { name: 'Agregar una unidad: Acetaminofén 500 mg' });
  await expect(mas).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('group', { name: 'Cantidad de Acetaminofén 500 mg' })).toContainText('2');

  // Buscar en el catálogo y abrir la vista rápida: Enter la abre, Esc la cierra y el foco vuelve al enlace.
  await page.keyboard.press('Shift+Tab');
  for (let i = 0; i < 40 && (await page.evaluate(() => document.activeElement?.id)) !== 'q-catalogo'; i++) {
    await page.keyboard.press('Shift+Tab');
  }
  await page.keyboard.type('suero');
  await expect(page.getByText('Mostrando 1–1 de 1 producto')).toBeVisible();
  await tabularHasta(page, { texto: 'Suero oral', dentroDe: 'h2' });
  await page.keyboard.press('Enter');
  const ficha = page.getByRole('dialog', { name: 'Suero oral' });
  await expect(ficha).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar detalles del producto' })).toBeFocused();
  await tabularHasta(page, { texto: 'Agregar al pedido' }, 20);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(ficha).toBeHidden();
  await expect(page.getByRole('link', { name: 'Suero oral', exact: true })).toBeFocused();

  // Buscador: se abre con la lupa, Esc lo cierra y el foco vuelve a la lupa.
  await page.keyboard.press('Shift+Tab');
  await tabularHasta(page, { etiqueta: 'Buscar productos', dentroDe: 'header' }, 200);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('searchbox', { name: 'Busca por nombre o síntoma' }).last()).toBeFocused();
  await page.keyboard.type('gripa');
  await expect(page.getByText('Resultados para «gripa» (4)')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Buscar productos' })).toBeHidden();
  await expect(page.locator('header').getByRole('link', { name: 'Buscar productos' })).toBeFocused();

  // Ir al pedido desde el contador del encabezado.
  await tabularHasta(page, { href: '/pedido' });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pedido$/);
  await expect(page.getByRole('heading', { name: '3 productos' })).toBeVisible();

  // Enviar sin datos: los errores aparecen y el foco va al primer campo inválido.
  await tabularHasta(page, { contiene: 'Enviar pedido por WhatsApp' });
  await page.keyboard.press('Enter');
  await expect(page.getByText('Escribe tu nombre.')).toBeVisible();
  await expect(page.getByLabel('Nombre', { exact: true })).toBeFocused();

  await page.keyboard.type('Ana Pérez');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Cra 1 # 2-3, Chapinero');
  await tabularHasta(page, { name: 'pago' });
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: 'Llave Bre-B' })).toBeChecked();
  await tabularHasta(page, { name: 'datos' });
  await page.keyboard.press('Space');
  await tabularHasta(page, { contiene: 'Enviar pedido por WhatsApp' });
  await page.keyboard.press('Enter');

  // WhatsApp se abre después de la celebración (650 ms). Sin GPU, compilar sus shaders bloquea el hilo varios segundos.
  const enviado = Date.now();
  await expect.poll(() => ventanasAbiertas(page), { timeout: 30_000 }).toHaveLength(1);
  console.log(`WhatsApp se abrió a los ${Date.now() - enviado} ms`);
  const [url] = await ventanasAbiertas(page);
  expect(url).toMatch(/^https:\/\/wa\.me\/\d*\?text=/);
  expect(decodeURIComponent(url.split('?text=')[1])).toBe(
    [
      'Hola, quiero hacer este pedido:',
      '• 2 × Acetaminofén 500 mg: $7.000',
      '• 1 × Suero oral: $6.200',
      'Subtotal: $13.200',
      'Nombre: Ana Pérez',
      'Dirección: Cra 1 # 2-3, Chapinero',
      'Pago: Llave Bre-B',
    ].join('\n'),
  );
});
