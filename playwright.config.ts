import { defineConfig } from '@playwright/test';

/**
 * Pruebas de navegador contra el build de producción (astro preview), dentro del contenedor
 * de Playwright: docker compose --profile pruebas run --rm pruebas
 */
export default defineConfig({
  testDir: 'pruebas',
  timeout: 45_000,
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:4322',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'DATOS_BORRADOR=1 npm run build && npx astro preview --host 127.0.0.1 --port 4322',
    url: 'http://127.0.0.1:4322',
    timeout: 180_000,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'escritorio', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    {
      name: 'celular',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
});
