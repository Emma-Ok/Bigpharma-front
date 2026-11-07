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

## 2. Configurar Cloudflare Workers (una sola vez)

El código está en GitHub (`Emma-Ok/Bigpharma-front`) y se despliega con **Workers Builds**: cada push a `main` y cada llamada al *deploy hook* construye y publica el sitio. El proyecto ya trae el adaptador `@astrojs/cloudflare` y `wrangler.jsonc`; todo el sitio es estático, así que el Worker solo sirve los archivos de `dist/client` (con `_headers`).

1. En Cloudflare: Workers & Pages → Create → **Import a repository** → elige `Emma-Ok/Bigpharma-front`.
2. Configuración del build:
   - Comando de build: `npm run build`
   - Comando de despliegue: `npx wrangler deploy`
   - Directorio raíz: `/`
3. Variables del build (Settings → Builds → Variables and secrets):

   | Variable | Valor |
   |---|---|
   | `NODE_VERSION` | `24` |
   | `SITIO_URL` | `https://www.tu-drogueria.com` (sin barra al final) |
   | `SHEETS_PRODUCTOS_CSV_URL` | enlace CSV de la pestaña Productos |
   | `SHEETS_ANUNCIOS_CSV_URL` | enlace CSV de la pestaña Anuncios |
   | `SHEETS_CONFIGURACION_CSV_URL` | enlace CSV de la pestaña Configuracion |
   | `VALIDAR_HOJA` | `estricto` cuando la hoja esté llena: el build falla si queda un campo `[entre corchetes]` o un aviso de datos. Sin ella, solo avisa |

4. Crea el deploy hook: en el Worker, Settings → Builds → **Deploy Hooks** → nombre «hoja», rama `main` → Create. Guarda la URL (`https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/…`): quien la tenga puede publicar el sitio. Cloudflare limita a 10 builds por minuto por Worker.
5. Agrega tu dominio en Settings → Domains & Routes.

### Botón «Publicar sitio» en la hoja (opcional)

En la hoja: Extensiones → Apps Script, pega esto (cambia la URL por la del deploy hook) y guarda:

```js
const DEPLOY_HOOK = 'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/...';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Sitio web').addItem('Publicar cambios', 'publicar').addToUi();
}

function publicar() {
  UrlFetchApp.fetch(DEPLOY_HOOK, { method: 'post' });
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
3. Usa el menú Sitio web → Publicar cambios (o abre la URL del deploy hook con una petición POST).
4. En Cloudflare (el Worker → Deployments) espera a que el despliegue quede en verde, de 1 a 3 minutos.
5. Abre el sitio y revisa el producto que cambiaste.

Si el build falla, Cloudflare **mantiene publicada la versión anterior**: nadie ve un sitio roto. El registro del build dice exactamente qué corregir, por ejemplo:

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
- [ ] Ningún texto `[entre corchetes]` y `VALIDAR_HOJA=estricto` activa en Workers Builds: desde ahí, el build falla y lista lo que falte.
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
