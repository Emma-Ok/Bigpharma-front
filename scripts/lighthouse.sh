#!/bin/sh
# Lighthouse en celular y escritorio contra el build de producción. Se corre en el contenedor de Playwright:
#   docker compose --profile pruebas run --rm pruebas sh scripts/lighthouse.sh
# Deja los informes en test-results/lighthouse/ y un resumen en la consola.
set -e
export CHROME_PATH="$(ls -d /ms-playwright/chromium-*/chrome-linux*/chrome | head -1)"
SALIDA=test-results/lighthouse
mkdir -p "$SALIDA"
npm run build > /dev/null 2>&1
npx astro preview --host 127.0.0.1 --port 4322 > /dev/null 2>&1 &
sleep 4
for ruta in / /catalogo /producto/acetaminofen-500-mg /pedido; do
  nombre=$(echo "$ruta" | sed 's#^/##; s#/#-#g'); nombre=${nombre:-inicio}
  for modo in celular escritorio; do
    preset=""; [ "$modo" = escritorio ] && preset="--preset=desktop"
    npx --yes lighthouse@13.6.0 "http://127.0.0.1:4322$ruta" $preset --quiet \
      --chrome-flags="--headless=new --no-sandbox" \
      --output=json --output=html --output-path="$SALIDA/$nombre-$modo" > /dev/null 2>&1 || echo "falló $ruta ($modo)"
  done
done
node -e '
const fs = require("fs");
const dir = "test-results/lighthouse";
const filas = fs.readdirSync(dir).filter((f) => f.endsWith(".report.json")).sort().map((f) => {
  const r = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
  const c = r.categories;
  const p = (k) => Math.round(c[k].score * 100);
  const a = r.audits;
  return `${f.replace(".report.json", "").padEnd(36)} Rend ${p("performance")}  Acc ${p("accessibility")}  BP ${p("best-practices")}  SEO ${p("seo")}  LCP ${a["largest-contentful-paint"].displayValue}  CLS ${a["cumulative-layout-shift"].displayValue}  TBT ${a["total-blocking-time"].displayValue}`;
});
console.log(filas.join("\n"));
'
