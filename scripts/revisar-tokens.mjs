// Falla si el código usa colores arbitrarios (bg-[#1E5AA0], text-[rgb(...)]) o la paleta por defecto de Tailwind.
// Regla de CLAUDE.md: solo utilidades de los tokens de docs/ESPECIFICACION.md, sección 6.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const RAIZ = 'src';
const EXTENSIONES = new Set(['.astro', '.tsx', '.ts']);
const PROPIEDADES = '(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|shadow|accent|caret|divide|placeholder)';
const ARBITRARIO = new RegExp(`\\b${PROPIEDADES}-\\[(?:#|rgb|hsl|oklch|color:)`, 'g');
const PALETA = new RegExp(
  `\\b${PROPIEDADES}-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\\d{2,3})?\\b`,
  'g',
);

async function* archivos(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) yield* archivos(ruta);
    else if (EXTENSIONES.has(path.extname(e.name))) yield ruta;
  }
}

const hallazgos = [];
for await (const archivo of archivos(RAIZ)) {
  const lineas = (await readFile(archivo, 'utf8')).split('\n');
  lineas.forEach((linea, i) => {
    for (const re of [ARBITRARIO, PALETA]) {
      for (const m of linea.matchAll(re)) hallazgos.push(`${archivo}:${i + 1}  ${m[0]}`);
    }
  });
}

if (hallazgos.length) {
  console.error(`Colores fuera de los tokens (usa bg-azul, text-tinta, etc.):\n  ${hallazgos.join('\n  ')}`);
  process.exit(1);
}
console.log('revisar-tokens: sin colores arbitrarios.');
