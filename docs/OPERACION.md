# Operación del sitio

Guía para quien mantiene la droguería en línea: cómo editar la hoja, cómo publicar los cambios y qué revisar antes. El sitio es estático: se genera de nuevo cada vez que se publica, con los datos que tenga la hoja en ese momento.

## 1. Preparar la hoja (una sola vez)

1. Sube `datos/catalogo_productos.xlsx` a Google Drive y ábrelo con Google Sheets (Archivo → Guardar como Hojas de cálculo de Google).
2. En la pestaña **Configuracion**, agrega estas filas, que el sitio usa y la plantilla todavía no trae:

   | clave | valor de ejemplo | Dónde se ve |
   |---|---|---|
   | `barrio` | Chapinero | Titular de la portada |
   | `autoridad_salud` | Secretaría Distrital de Salud | Portada y pie |
   | `razon_social` | Droguería Ejemplo S.A.S. | Pie y política de datos |
   | `nit` | 900.123.456-7 | Pie y política de datos |

3. Publica cada pestaña como CSV: Archivo → Compartir → **Publicar en la web** → elige la pestaña (Productos, Anuncios, Configuracion) → formato **Valores separados por comas (.csv)** → Publicar. Copia el enlace de cada una.

## 2. Configurar GitHub Actions y Cloudflare (una sola vez)

El código está en GitHub (`Emma-Ok/Bigpharma-front`). El workflow `.github/workflows/ci.yml` hace todo:

- **En cada PR y cada push a `main`:** `check` (astro check, ESLint y tokens), Vitest y Playwright con axe. Las pruebas usan las copias de `datos/`.
- **Solo en `main` y si todo pasa:** build con los datos de la hoja y `npx wrangler deploy` a Cloudflare Workers. Si una prueba o el build fallan, no se despliega y sigue publicada la versión anterior.
- **Botón «Run workflow»** (pestaña Actions → CI/CD): vuelve a construir y desplegar sin cambiar el código. Es lo que usa la hoja para publicar.

El proyecto ya trae el adaptador `@astrojs/cloudflare` y `wrangler.jsonc`; todo el sitio es estático, así que el Worker solo sirve los archivos de `dist/client` (con `_headers`).

1. En Cloudflare: My Profile → API Tokens → Create Token → plantilla **Edit Cloudflare Workers** → elige tu cuenta → Create. Copia el token (solo se muestra una vez). Copia también el **Account ID** (Workers & Pages, columna derecha).
2. En GitHub, el despliegue usa el ambiente **`qa`** (Settings → Environments → qa). Ahí, o en Settings → Secrets and variables → Actions para todo el repositorio:
   - **Secrets:** `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
   - **Variables:**

   | Variable | Valor |
   |---|---|
   | `SITIO_URL` | URL pública sin barra al final. Para la prueba, la de `workers.dev` que da el primer despliegue |
   | `SITIO_PUBLICO` | Vacía mientras sea una prueba: todas las páginas llevan `noindex`. `si` solo para el lanzamiento real |
   | `SHEETS_PRODUCTOS_CSV_URL` | Enlace CSV de la pestaña Productos. Sin ella, se usa `datos/productos.csv` |
   | `SHEETS_ANUNCIOS_CSV_URL` | Enlace CSV de la pestaña Anuncios |
   | `SHEETS_CONFIGURACION_CSV_URL` | Enlace CSV de la pestaña Configuracion |
   | `VALIDAR_HOJA` | `estricto` cuando la hoja esté llena: el build falla si queda un campo `[entre corchetes]` o un aviso de datos. Sin ella, solo avisa |

3. Haz push a `main` (o usa «Run workflow»). El primer despliegue crea el Worker `bigpharma` y el registro del paso «Desplegar a Cloudflare» muestra su URL (`https://bigpharma.<tu-subdominio>.workers.dev`). Ponla en `SITIO_URL` y vuelve a correr el workflow para que la URL canónica y el sitemap queden bien.
4. Cuando tengas dominio: en Cloudflare, el Worker → Settings → Domains & Routes; luego cambia `SITIO_URL`.

### Botón «Publicar sitio» en la hoja (opcional)

La hoja dispara el workflow con la API de GitHub. Crea un token en GitHub: Settings → Developer settings → Fine-grained tokens → solo el repositorio `Bigpharma-front` → permiso **Actions: Read and write**. Quien tenga el token puede publicar el sitio (no puede cambiar el código).

En la hoja: Extensiones → Apps Script, pega esto y guarda. El token va en las propiedades del script, no en el código: Configuración del proyecto → Propiedades de la secuencia de comandos → `GITHUB_TOKEN`.

```js
const FLUJO = 'https://api.github.com/repos/Emma-Ok/Bigpharma-front/actions/workflows/ci.yml/dispatches';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Sitio web').addItem('Publicar cambios', 'publicar').addToUi();
}

function publicar() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  UrlFetchApp.fetch(FLUJO, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
    payload: JSON.stringify({ ref: 'main' }),
  });
  SpreadsheetApp.getUi().alert('Listo. El sitio se actualiza en unos minutos.');
}
```

La primera vez Google pide autorizar el script.

## 3. Editar la hoja

- **Un producto por fila** en la pestaña Productos. El `id` no se repite ni se cambia (el carrito de los clientes lo usa).
- **Precios en pesos, sin puntos ni signos:** `3500`, no `$3.500` ni `3.500`. Un precio con punto rompe la publicación a propósito, para que no salga a $3,5.
- **`precio_por_unidad` y `descuento` no se editan:** el sitio los calcula.
- **Medicamentos con fórmula** (`condicion_venta = formula`): el sitio nunca muestra su precio ni los deja agregar al pedido, aunque la celda tenga un valor.
- **Textos sanitarios** (`para_que_sirve`, `como_se_usa`, `advertencias`): se copian tal cual del empaque o del inserto aprobado por el Invima. El sitio los muestra sin cambios.
- **Promociones:** `precio_antes` solo si hay promoción y debe ser mayor que `precio` (si no, el sitio lo ignora). Evita promociones en medicamentos: su publicidad requiere autorización previa del Invima.
- **Disponibilidad:** `agotado` cambia el botón a «Preguntar disponibilidad»; `pocas` muestra «Quedan pocas unidades».
- **Fotos:** enlaces `https://…` públicos (fondo blanco, cuadradas o horizontales). Sin foto, el sitio dibuja el empaque.
- **Anuncios:** solo se muestran los de `activo = si`. El texto va en las columnas, nunca escrito dentro de la imagen; `alt_foto` describe la foto para quien no la ve.
- **Configuracion:** `whatsapp` en formato wa.me, solo dígitos con indicativo (`573001234567`). `domicilio_gratis_desde` en pesos, sin puntos. Los avisos `aviso_1` a `aviso_3` son los mensajes de la barra superior.

## 4. Publicar un cambio

1. Edita la hoja.
2. **Espera unos 5 minutos:** Google tarda en actualizar el CSV publicado.
3. Usa el menú Sitio web → Publicar cambios (o, en GitHub, Actions → CI/CD → Run workflow).
4. En GitHub (pestaña Actions) espera a que el workflow quede en verde: las pruebas y el despliegue tardan unos minutos.
5. Abre el sitio y revisa el producto que cambiaste.

Si el build o una prueba fallan, no se despliega y **sigue publicada la versión anterior**: nadie ve un sitio roto. El registro del paso «Desplegar a Cloudflare» dice exactamente qué corregir, por ejemplo:

```
Los datos de la hoja tienen errores:
  - Productos, fila 7 (id a3): falta «precio» (obligatorio en venta libre)
  - Productos, fila 12 (id c4): «3.500» en «precio» debe ser un número entero en pesos, sin puntos ni signos
  - Configuracion: falta «domicilio_gratis_desde»
```

La fila es la de la hoja (la fila 1 son los encabezados). Si Google no responde, el build también falla en vez de publicar precios viejos.

## 5. Qué revisar antes de publicar

- [ ] Ningún producto de venta libre sin precio, y precios sin puntos.
- [ ] Los medicamentos con fórmula tienen `condicion_venta = formula`.
- [ ] Indicaciones, modo de uso y advertencias copiados del empaque o inserto, sin redactar.
- [ ] Registro Invima o notificación sanitaria en cada producto.
- [ ] Promociones vigentes; las vencidas, sin `precio_antes` y con el anuncio en `activo = no`.
- [ ] WhatsApp, horario, zonas y domicilio gratis al día en Configuracion.
- [ ] Ningún texto `[entre corchetes]` y `VALIDAR_HOJA=estricto` activa en las variables de GitHub Actions: desde ahí, el build falla y lista lo que falte.
- [ ] `SITIO_PUBLICO=si` y `SITIO_URL` con el dominio real (solo para el lanzamiento).
- [ ] La política de datos y los términos revisados por un abogado (hoy son texto base).

## 6. Desarrollo local

Todo corre en Docker (ver «Entorno» en `CLAUDE.md`):

```sh
cp .env.example .env            # opcional: URLs de las pestañas
docker compose up -d            # http://localhost:4321
docker compose exec web npm run build
docker compose --profile pruebas run --rm pruebas   # accesibilidad y recorrido con Playwright
```

Sin las variables `SHEETS_*`, el sitio usa `datos/productos.csv`, `datos/anuncios.csv` y `datos/configuracion.csv`. Si la descarga falla en desarrollo, también usa esas copias y avisa en la consola.
