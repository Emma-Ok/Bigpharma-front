import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const CLAVE_CARRITO = 'carrito:v1';

/** Deja el carrito con productos antes de cargar la página. */
export async function conCarrito(page: Page, lineas: { id: string; cantidad: number }[]) {
  await page.addInitScript(
    ([clave, valor]) => {
      if (!sessionStorage.getItem('carrito-sembrado')) {
        localStorage.setItem(clave, valor);
        sessionStorage.setItem('carrito-sembrado', '1');
      }
    },
    [CLAVE_CARRITO, JSON.stringify(lineas)],
  );
}

/** Captura las URL que el sitio intenta abrir con window.open (envío a WhatsApp). */
export async function capturarVentanas(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __abiertas: string[]; __envio: number; __demora: number };
    w.__abiertas = [];
    document.addEventListener('submit', () => (w.__envio = performance.now()), true);
    window.open = (url?: string | URL) => {
      w.__demora = performance.now() - w.__envio;
      w.__abiertas.push(String(url));
      return {} as Window;
    };
  });
}

export async function ventanasAbiertas(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __abiertas: string[] }).__abiertas);
}

/** Milisegundos entre el envío del formulario y la apertura de WhatsApp. */
export async function demoraWhatsApp(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __demora: number }).__demora);
}

/** Simula una GPU real: en el contenedor WebGL va por software y las escenas 3D no se cargan. */
export async function conGpu(page: Page) {
  await page.addInitScript(() => {
    for (const contexto of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const original = contexto.prototype.getParameter;
      contexto.prototype.getParameter = function (p: number) {
        return p === 0x9246 ? 'GPU de prueba' : original.call(this, p);
      };
    }
  });
}

/** axe con las reglas WCAG 2.2 A y AA; deja que terminen las animaciones de entrada. */
export async function sinViolaciones(page: Page, contexto = '') {
  await page.waitForTimeout(900);
  // @axe-core/playwright declara el Page de otra versión de playwright-core; en ejecución es el mismo objeto.
  const { violations } = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]['page'] })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const resumen = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(resumen, `Violaciones de axe ${contexto}`).toEqual([]);
}

export interface Objetivo {
  /** aria-label exacto. */
  etiqueta?: string;
  /** Texto visible (recortado) exacto o incluido con `contiene`. */
  texto?: string;
  contiene?: string;
  href?: string;
  name?: string;
  id?: string;
  /** Selector de un ancestro obligatorio. */
  dentroDe?: string;
}

/** Presiona Tab hasta que el elemento enfocado coincida con el objetivo (máximo `max` veces). */
export async function tabularHasta(page: Page, objetivo: Objetivo, max = 150) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const ok = await page.evaluate((o) => {
      const el = document.activeElement;
      if (!el) return false;
      const texto = (el.textContent ?? '').trim();
      return (
        (o.etiqueta === undefined || el.getAttribute('aria-label') === o.etiqueta) &&
        (o.texto === undefined || texto === o.texto) &&
        (o.contiene === undefined || texto.includes(o.contiene)) &&
        (o.href === undefined || el.getAttribute('href') === o.href) &&
        (o.name === undefined || el.getAttribute('name') === o.name) &&
        (o.id === undefined || el.id === o.id) &&
        (o.dentroDe === undefined || el.closest(o.dentroDe) !== null)
      );
    }, objetivo);
    if (ok) return;
  }
  throw new Error(`No se llegó con Tab a ${JSON.stringify(objetivo)}`);
}
