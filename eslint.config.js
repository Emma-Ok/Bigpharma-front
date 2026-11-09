import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';

export default defineConfig(
  { ignores: ['dist/', '.astro/', 'node_modules/', 'playwright-report/', 'test-results/'] },
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],
  {
    files: ['**/*.tsx'],
    plugins: { 'jsx-a11y-x': jsxA11y },
    rules: jsxA11y.configs.recommended.rules,
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Reglas de dependencia de docs/ARQUITECTURA.md. Cada carpeta lleva su lista completa:
  // en flat config, la última regla que aplica a un archivo reemplaza a las anteriores.
  ...capas(),
);

function capas() {
  const sinHoja = { group: ['@/hoja/*'], message: 'Nada que llegue al navegador importa de hoja/ (solo pages y layouts).' };
  const funcionalidad = (nombre) => ({
    group: [`@/funcionalidades/${nombre}/*`],
    message: `Entre funcionalidades solo se importa en este orden: catalogo → producto → pedido.`,
  });
  const regla = (files, patterns, ignores = []) => ({
    files,
    ignores,
    rules: { 'no-restricted-imports': ['error', { patterns }] },
  });
  return [
    regla(
      ['src/dominio/**/*.ts'],
      [
        sinHoja,
        { group: ['preact', 'preact/*', 'astro', 'astro:*', 'astro/*', 'node:*'], message: 'dominio/ es TypeScript puro: sin Preact, Astro, Node ni DOM.' },
        { group: ['@/compartido/*', '@/funcionalidades/*', '@/layouts/*', '@/pages/*'], message: 'dominio/ no depende de las capas de arriba.' },
      ],
      ['src/dominio/**/__tests__/**'],
    ),
    regla(['src/compartido/**/*.{ts,tsx,astro}'], [
      sinHoja,
      { group: ['@/funcionalidades/*', '@/layouts/*', '@/pages/*'], message: 'compartido/ no importa de funcionalidades/.' },
    ]),
    regla(['src/funcionalidades/pedido/**/*.{ts,tsx,astro}'], [sinHoja, funcionalidad('producto'), funcionalidad('catalogo'), funcionalidad('portada'), funcionalidad('anuncios')]),
    regla(['src/funcionalidades/producto/**/*.{ts,tsx,astro}'], [sinHoja, funcionalidad('catalogo'), funcionalidad('portada'), funcionalidad('anuncios')]),
    regla(['src/funcionalidades/catalogo/**/*.{ts,tsx,astro}'], [sinHoja, funcionalidad('portada'), funcionalidad('anuncios')]),
    regla(['src/funcionalidades/{portada,anuncios}/**/*.{ts,tsx,astro}'], [
      sinHoja,
      { group: ['@/funcionalidades/*', '!@/funcionalidades/portada/*', '!@/funcionalidades/anuncios/*'], message: 'portada y anuncios no importan de otras funcionalidades.' },
    ]),
  ];
}
