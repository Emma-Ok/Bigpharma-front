# Progreso

Bitácora del trabajo autónomo de las fases 1 a 7 (`docs/PROMPT-INICIAL.md`). Si el contexto se reinicia, leer esto primero.

## Qué revisar primero

1. **El sitio está corriendo** en http://localhost:4321 (`docker compose up -d`). Recorre `/`, `/catalogo`, una ficha (clic en el nombre abre la vista rápida), agrega productos y envía un pedido en `/pedido` (abre `wa.me`).
2. **Desviaciones aprobadas** (ver también «Ronda 2»): la imagen estática de las cápsulas es un SVG en línea, no `hero-capsulas.webp` (ver «Decisiones», fase 6). Con la `.webp`, el elemento LCP pasaba a ser la imagen y se rompía el criterio de aceptación. Ya está en la sección 1 de `docs/MOVIMIENTO-Y-3D.md`.
3. **Datos por llenar** (`docs/OPERACION.md`, sección 1): la hoja todavía tiene textos `[entre corchetes]`, el WhatsApp es un marcador y faltan 4 claves nuevas en Configuracion (`barrio`, `autoridad_salud`, `razon_social`, `nit`). Cuando estén, activa `DATOS_ESTRICTOS=1`.
4. **Textos legales** (`/politica-de-datos`, `/terminos`): son base y dicen «pendiente de revisión legal».
5. **Despliegue:** no se hizo. Para el *deploy hook* de Cloudflare Pages hace falta un repositorio Git (ver `docs/OPERACION.md`, sección 2).
6. **Decisiones** (abajo): todas las elecciones que no estaban en CLAUDE.md ni en `docs/`.

## Ronda 2 (después de las 7 fases, 2026-10-31)

Hecho:
- **Repositorio y despliegue:** `.gitignore`, adaptador `@astrojs/cloudflare` (Workers) con `prerenderEnvironment: 'node'`, `session: false` e `imageService: 'passthrough'` (sin KV ni Cloudflare Images), `wrangler.jsonc`, push a `Emma-Ok/Bigpharma-front` (`main`). La imagen de Docker suma `ca-certificates` (workerd los necesita) y el servidor de desarrollo arranca con `--ignore-lock`. `docs/OPERACION.md` describe Workers Builds y su deploy hook.
- **`npm audit`:** 0 vulnerabilidades (`overrides.minimatch: ^11.0.1`).
- **Vaciar el pedido:** en el panel del carrito y en `/pedido`, con confirmación en dos pasos, Esc y foco controlado.
- **Vista rápida:** ya no se ve el fondo antes que la ficha. Los nombres de View Transition dependen del tipo de transición (solo la imagen elegida crece; el panel entra como bloque) y la ficha se precarga al pasar el puntero o enfocar.
- **Carruseles (avisos y anuncios):** pista con scroll-snap que desliza (flechas, puntos, gesto), avanza sola cada 6 s y se pausa con el puntero encima, con el foco dentro y con un botón visible; con movimiento reducido arranca pausada. En celular asoma el anuncio siguiente.
- **3D en más vistas y en celular** (`src/scripts/3d/`): motor común, hero (22 cápsulas + 10 tabletas, niebla, luz de contorno, entrada volando, piezas que se apartan del puntero), banda en la cabecera del catálogo y en la 404, jeringa y frasco en servicios, empaque 3D en la ficha cuando no hay foto, y celebración de cápsulas al enviar el pedido y al alcanzar el domicilio gratis. Se carga con la primera interacción y cada escena cuando está cerca de la pantalla.
- **Celular:** menú y filtros se superponen (no empujan la página) y se cierran con Esc, tocando fuera o con su botón. «Ver catálogo» del hero lleva a `/catalogo`.
- **CLS 0:** fuente de respaldo con las métricas de Lexend («Lexend Fallback») y el contador del pedido pasó de isla a script (el runtime de islas quedaba en medio de la navegación y la hacía saltar).
- Clases de Tailwind canónicas (`gap-[18px]` → `gap-4.5`, etc.).

Decisiones de esta ronda:
- **Rotación automática** (pedida): contradice «Sin autoplay en carruseles» de CLAUDE.md; se hizo cumpliendo WCAG 2.2.2 (pausa con puntero, foco y botón; movimiento reducido = pausada; los cambios automáticos no se anuncian).
- **3D fuera de la portada y en celular** (pedido): contradice «un solo momento 3D» y la regla de no cargar three.js en celular. Para no perder rendimiento, three.js se carga con la primera interacción (puntero, toque, scroll o teclado) en todos los dispositivos; con movimiento reducido, ahorro de datos, menos de 2 GB de memoria o sin WebGL nunca se carga.
- **En celular las piezas solo asoman por los bordes** del hero y de las bandas: el texto ocupa todo el ancho y no puede quedar detrás de una pieza.
- **La celebración retrasa 650 ms la apertura de WhatsApp** para que se vea; sin 3D, WhatsApp se abre de inmediato.
- Aprobado el 2026-11-06: CLAUDE.md, `docs/ESPECIFICACION.md` y `docs/MOVIMIENTO-Y-3D.md` ya tienen estas reglas nuevas.

Calidad: `check`, 46 pruebas de Vitest, 59 de Playwright (axe con y sin movimiento, teclado, carruseles, menú y filtros superpuestos, vaciar pedido, 3D). Lighthouse: 100 en Rendimiento, Accesibilidad y Buenas prácticas en todas las páginas (99 en `/pedido` celular), SEO 100 salvo `/pedido` (66 por `noindex`), CLS 0.

## Resultado de calidad (fase 7)

- `npm run check` (astro check + ESLint con reglas de accesibilidad + revisión de tokens), `npm run build` (30 páginas) y `npm run test` (45 pruebas de Vitest): pasan.
- Playwright + axe (`docker compose --profile pruebas run --rm pruebas`): 44 pasan, 4 omitidas a propósito (pruebas solo de escritorio o solo de celular). Incluye axe sin violaciones (WCAG 2.2 A/AA) en `/`, `/catalogo`, dos fichas, `/pedido`, el buscador abierto y la vista rápida, con movimiento activo y reducido; el pedido completo solo con teclado hasta el mensaje exacto de WhatsApp; las pruebas de movimiento de `docs/MOVIMIENTO-Y-3D.md`; y reglas sanitarias (fórmula sin precio ni carrito, leyenda, JSON-LD).
- Lighthouse 13.6 (`scripts/lighthouse.sh`, build de producción):

  | Página | Celular (Rend / Acc / BP / SEO, LCP) | Escritorio (Rend / Acc / BP / SEO, LCP) |
  |---|---|---|
  | `/` | 100 / 100 / 100 / 100, 1,5 s | 100 / 100 / 100 / 100, 0,4 s |
  | `/catalogo` | 100 / 100 / 100 / 100, 1,7 s | 100 / 100 / 100 / 100, 0,4 s |
  | `/producto/acetaminofen-500-mg` | 100 / 100 / 100 / 100, 0,8 s | 100 / 100 / 100 / 100, 0,2 s |
  | `/pedido` | 100 / 100 / 100 / 66, 1,7 s | 100 / 100 / 100 / 66, 0,2 s |

  El 66 de SEO en `/pedido` es por el `noindex` que exige CLAUDE.md. CLS máximo 0,023 (escritorio).

## Estado

| Fase | Estado |
|---|---|
| 0. Entorno Docker | Hecho |
| 1. Base del proyecto | Hecho |
| 2. Catálogo y producto | Hecho |
| 3. Inicio | Hecho |
| 4. Pedido | Hecho |
| 5. Datos reales y despliegue | Hecho |
| 6. Movimiento y 3D | Hecho |
| 7. Calidad | Hecho |

## Fase 0: entorno

- Imagen `bigpharma-web:dev` (Node 24.22.2, bookworm-slim). Servicio `pruebas` con `mcr.microsoft.com/playwright:v1.62.1-jammy` (ya estaba descargada). `pwuser` y `node` tienen uid 1000.
- Versiones vigentes al empezar (2026-10-31): astro 7.4, preact 11.1, tailwindcss 4.3, typescript 7.0, vitest 5.0, eslint 10.14, zod 4.6, three 0.187.

## Fase 1: base

Hecho: Astro 7 + Preact 11 + Tailwind 4 (`@tailwindcss/vite`), tokens en `src/styles/global.css`, Lexend alojada con `@fontsource-variable/lexend` y precarga del subconjunto latino, `src/lib/` (csv, formato, catalogo, datos, carrito, whatsapp) con 32 pruebas de Vitest, layout `Base.astro` con enlace para saltar al contenido, barra de avisos, encabezado (menú móvil con `aria-expanded` y Esc), pie y `<ClientRouter />`. `check`, `build` y `test` pasan. La recarga automática funciona en Docker sin sondeo (`VIGILAR_CON_SONDEO=1` lo activa si algún día falla).

## Fase 2: catálogo y producto

Hecho: `TarjetaProducto`, `ControlCantidad` (Agregar → − / + con foco que no se pierde), `IlustracionProducto` (empaque dibujado cuando no hay foto), `FichaProducto`, `DialogoFicha` (vista rápida con `<dialog>` modal), isla `Catalogo` (búsqueda, filtros con conteo, orden y paginación en la URL), `/catalogo`, `/producto/[slug]` (24 páginas) y `/producto/[slug].json`. JSON-LD `Product`/`Offer` solo en venta libre y `BreadcrumbList` en catálogo y producto. 41 pruebas de Vitest. Capturas revisadas en 390 y 1440 px (`scripts/capturas.mjs`).

## Fase 3: inicio

Hecho: portada con hero (titular en dos líneas para la entrada animada), `PresentacionProfesional`, `CarruselAnuncios` (isla, sin autoplay) y `AnuncioLateral` desde la pestaña Anuncios, `CatalogoResumido` (isla: campo que abre el buscador, `CategoriasIconos` con `aria-pressed`, 2 filas exactas en 2/3/4/5 columnas, vista rápida y `PanelPedido` en escritorio), `Servicios`, `PreguntasFrecuentes` (`details`/`summary`) y JSON-LD `Pharmacy`. `Buscador` (diálogo global en el layout, `client:idle`) y `BarraPedidoMovil` (todas las páginas menos `/pedido`).

## Fase 4: pedido

Hecho: `PanelPedido` (portada, escritorio) y `BarraPedidoMovil` (celular, todas las páginas menos `/pedido`) con progreso hacia el domicilio gratis (`role="progressbar"`, check al 100 %). `/pedido` (`noindex`, fuera del sitemap): resumen editable, formulario (nombre, barrio y dirección, forma de pago, autorización con enlace a la política), vista previa del mensaje y envío a `wa.me`. `/politica-de-datos` y `/terminos` con texto base y aviso visible «pendiente de revisión legal». Página 404.

## Fase 5: datos reales y despliegue

Hecho: `src/lib/datos.ts` lee `SHEETS_PRODUCTOS_CSV_URL`, `SHEETS_ANUNCIOS_CSV_URL` y `SHEETS_CONFIGURACION_CSV_URL`, con respaldo a `datos/*.csv` (4 pruebas con un servidor HTTP local). `.env.example`, `robots.txt` (con el sitemap), `public/_headers` para Cloudflare Pages, URL canónica en cada página (`SITIO_URL`) y `docs/OPERACION.md`. No se desplegó nada ni se crearon cuentas.

## Fase 6: movimiento y 3D

Hecho: View Transitions con tipos (`ficha` 240 ms, `cuadricula` 220 ms, `carrusel` 280 ms con 12 px según dirección; cambio de página 280 ms), imagen y nombre del producto con `view-transition-name` de la tarjeta a la ficha (página y vista rápida), punto de 10 px que viaja al contador y latido del contador (Web Animations API), entrada del buscador (8 px, 180 ms) y fundido de resultados, anillo de categoría, barra de domicilio con check dibujado, `details` con `interpolate-size`, hover solo con `pointer: fine`, entrada única de la portada (líneas del titular con 60 ms entre sí, luego la ficha). Escena de cápsulas (`src/scripts/capsulas.ts`): 16 cápsulas, dos `InstancedMesh` (una por mitad), mate, parallax de 6° máx., pausa con `IntersectionObserver` y `visibilitychange`, opacidad a 0 en los primeros 400 px de scroll, mitad de cápsulas y sin parallax si baja de 40 fps durante 2 s, limpieza al salir de la página. Se carga con `import()` dentro de `requestIdleCallback` después de `load`, solo con: sin movimiento reducido, ancho ≥ 768, sin ahorro de datos, `deviceMemory` ≥ 4 y WebGL.

Medición (build de producción, `scripts/medir.mjs`; celular = 390 px, red 1,6 Mbps / 150 ms y CPU ×4):

| | Antes | Después |
|---|---|---|
| LCP celular | 760 ms (párrafo del hero) | 704 ms (párrafo del hero) |
| LCP escritorio | 172 ms (párrafo del hero) | 144 ms (párrafo del hero) |
| JS de la portada sin three (gzip) | 29,1 KB | 30,6 KB celular / 31,7 KB escritorio |
| Chunk de three (gzip) | — | 129,4 KB, solo escritorio, después de `load` |
| CLS | 0 | 0 |

## Fase 7: calidad

Hecho: `playwright.config.ts` (build + `astro preview` dentro del contenedor de pruebas; proyectos escritorio 1440 px y celular 390 px), `pruebas/` (accesibilidad, teclado, movimiento, reglas), `scripts/lighthouse.sh`, `scripts/medir.mjs` y `scripts/capturas.mjs`. Errores reales que encontraron las pruebas y se corrigieron: Esc no cerraba el buscador con el foco en el campo de búsqueda (el navegador solo borra el texto); el foco se perdía en varios botones que desaparecen (resuelto en las fases 2 a 4).

## Decisiones

- **Versiones con conflictos de pares:** `typescript@~6.0` (typescript-eslint no admite 7) y `eslint@10` con `eslint-plugin-jsx-a11y-x` (el `jsx-a11y` original no admite ESLint 10). Accesibilidad en `.astro` con `astro.configs['flat/jsx-a11y-recommended']`.
- **Zod:** `astro/zod` (Zod 4 incluido en Astro), sin dependencia nueva.
- **Precio:** `formatearPrecio` usa `Intl.NumberFormat('es-CO', COP)` y quita el espacio entre `$` y el número para que el mensaje coincida con la sección 2 (`$7.000`).
- **Datos:** se agregaron `datos/configuracion.csv` y `datos/anuncios.csv` (copiados de las pestañas de la plantilla) y cuatro claves nuevas en Configuracion: `barrio` (titular de la portada), `autoridad_salud`, `razon_social` y `nit` (pie). Los textos `[entre corchetes]` no rompen el build: se cuentan y se avisan; con `DATOS_ESTRICTOS=1` sí lo rompen. Un WhatsApp inválido es aviso, no error, por la misma razón.
- **Fórmula sin precio por tipo:** `ProductoFormula` no tiene campo `precio`; si la hoja trae uno, se descarta.
- **`precio_antes` ≤ `precio`:** se ignora con un aviso en vez de romper el build.
- **Precio por unidad:** solo si `unidades > 1`.
- **Carrito:** guarda solo `{id, cantidad}` en `carrito:v1`; nombre y precio salen del catálogo vigente (`/productos.json`). Cantidad entre 1 y 99.
- **Formas de pago:** lista fija en `src/lib/whatsapp.ts` (Nequi, Llave Bre-B, Tarjeta (link de pago), Efectivo), la misma del pie y de las preguntas frecuentes.
- **Mensajes de WhatsApp no definidos en la especificación** (`src/lib/whatsapp.ts`): disponibilidad («Hola, quiero saber cuándo vuelven a tener X.»), búsqueda sin resultados («Hola, ¿consiguen X?»), inyectología y consulta general.
- **Puntos de corte:** 600, 900 y 1200 px (los de los mockups) como `sm`, `md`, `lg`; documentados en la sección 6.
- **`npm run check`** también corre `scripts/revisar-tokens.mjs`, que falla si aparece un color arbitrario o de la paleta por defecto.
- **Búsqueda en `/catalogo`:** campo dentro de la página (como el mockup de catálogo); filtra la cuadrícula y queda en la URL (`?q=`). El diálogo del buscador es el de la lupa y el de la portada.
- **Parámetros de URL del catálogo:** `q`, `categoria`, `tipo`, `descuento=1`, `orden` (`relevancia`, `precio-asc`, `precio-desc`, `nombre`), `pagina`. 20 productos por página. Se escriben con `history.replaceState` conservando `history.state` (para no confundir al router de Astro). La página estática muestra el catálogo sin filtros; la isla aplica los de la URL al cargar.
- **Orden «Destacados»:** primero con descuento, después disponibles, luego por nombre; los agotados al final.
- **`CategoriasIconos`** se usa en la portada; en `/catalogo` la categoría se elige en el panel de filtros (radios con conteo), como en el mockup.
- **Vista rápida:** pide `/producto/<slug>.json` al abrir (el HTML del catálogo no lleva los textos largos). Si falla, navega a la página del producto. «Ver la página completa del producto» al final del diálogo.
- **Ficha:** la leyenda «Si los síntomas persisten, consulte a su médico» solo en medicamentos (`tipo = med`) de venta libre; en fórmula, «Este medicamento requiere fórmula médica.». Los textos de la hoja se muestran tal cual (`white-space: pre-line`).
- **Títulos de tarjeta:** `h2` en `/catalogo` (debajo del `h1`), `h3` dentro de secciones.
- **Servidor de desarrollo:** `allowedHosts: ['web']` para que el contenedor de pruebas llegue a `http://web:4321`.
- **Anuncios sin foto:** en lugar del espacio vacío del mockup se muestra el ícono de la categoría en un círculo (decorativo). Fondo del anuncio: el tinte de su categoría, o `azul-claro`. El anuncio lateral muestra «Ver catálogo» si tiene `enlace` y no tiene `boton_texto`.
- **«Lo más buscado»** en el buscador: lista fija del mockup (dolor de cabeza, suero, protector solar, gripa). «Productos destacados»: los 10 primeros por orden «Destacados».
- **Servicios:** se omitió la línea «También ofrecemos [otro servicio]…» del mockup (no hay dato en la hoja).
- **Preguntas frecuentes:** si `costo_domicilio` es 0 o vacío, se dice «te confirmamos el valor del domicilio por WhatsApp» en vez de «$0».
- **Regiones `aria-live`:** el panel del pedido anuncia solo subtotal y domicilio (no toda la lista); la barra móvil anuncia el resumen; además hay una región global (`#anuncios-pedido`) con «Agregaste X al pedido». Al quitar una línea, el foco pasa al título del panel.
- **Formas de pago** con los textos del mockup del pedido: «Nequi», «Llave Bre-B», «Tarjeta, con link de pago», «Efectivo al recibir» (así llegan en el mensaje).
- **Pedido:** validación propia (`noValidate`) con mensajes junto a cada campo, `aria-invalid` y foco en el primer error. El envío abre `wa.me` en una pestaña nueva; si el navegador lo bloquea, navega a `wa.me`. Después aparece «Si no se abrió, toca aquí». El carrito no se vacía al enviar (el cliente puede necesitar reenviarlo). Nombre y dirección no se guardan en ningún lado (Ley 1581). Al bajar a 0 una línea, el foco pasa al título «n productos».
- **`/pedido` con el encabezado normal del sitio** (el mockup tiene uno reducido con «Seguir comprando»); «Seguir comprando» va debajo del resumen.
- **Textos legales:** base en español, marcados para revisión de un abogado; la política menciona que la foto de la fórmula es dato sensible y opcional.
- **Descarga fallida de Sheets:** en desarrollo usa la copia local con aviso; en `astro build` falla con un mensaje claro, para no publicar precios viejos (Cloudflare conserva el despliegue anterior).
- **Plantilla `.xlsx` sin modificar:** las 4 claves nuevas de Configuracion se documentan en `docs/OPERACION.md` (editar el .xlsx con una librería podía dañar las validaciones y formatos).
- **Deploy hook:** Cloudflare solo los ofrece en proyectos conectados a Git; quedó documentado. Incluye un Apps Script opcional con el menú «Sitio web → Publicar cambios».
- **Sin CSP** en `_headers` por ahora (las islas y el JSON-LD usan scripts en línea); se puede agregar con hashes más adelante.
- **Imagen estática de respaldo en SVG en línea, no `hero-capsulas.webp`** (desviación de `docs/MOVIMIENTO-Y-3D.md`): con la `.webp` (12 KB) el elemento LCP pasaba a ser la imagen (916 ms en celular) y se rompía el criterio «el elemento LCP es el titular». `scripts/generar-capsulas.mjs` proyecta con la cámara de three.js las mismas 16 cápsulas (misma semilla) y escribe `src/assets/capsulas.svg` (4,4 KB, vectorial, sin petición de red, sin `<canvas>`). Las cápsulas se ubican fuera de la zona del texto del titular para no bajar el contraste.
- **Geometría:** cada mitad de cápsula es una `LatheGeometry` (perfil de tramo recto + casquete); la segunda `InstancedMesh` usa la misma geometría girada 180°. Se usa en vez de `CapsuleGeometry` porque esta no se puede partir en dos mitades sin utilidades extra.
- **Entrada del titular:** las líneas arrancan con opacidad 0,01 (no 0) porque Chrome no cuenta como LCP los elementos invisibles; con 0 el LCP pasaba a ser la barra de avisos.
- **Elemento LCP:** es el párrafo del hero («Pide tus medicamentos…»), que tiene más área que cada línea del `h1` (el `h1` está partido en dos líneas para la animación). Es texto del bloque del titular, no la escena ni una imagen.
- **`npm run test`** corre Vitest; Playwright va en `npm run test:e2e`, que es el comando del servicio `pruebas` (la imagen de Node no trae navegadores). Se cambió el `command` de ese servicio en `docker-compose.yml` a `npm run test:e2e`. Las pruebas usan su propio build en el puerto 4322; `BASE_URL` (servidor de desarrollo) queda para `scripts/capturas.mjs`.
- **Movimiento reducido en Playwright:** se pasa con `contextOptions: { reducedMotion }`; `test.use({ reducedMotion })` dentro de un `describe` no se aplicaba en esta versión (cada prueba ahora verifica `matchMedia`).
- **Contador del pedido en el encabezado (escritorio):** enlace a `/pedido` con número; sirve de destino para la animación de «Agregar».

## Fallos abiertos

- Ninguna prueba falla.

- `npm audit`: 12 avisos moderados de `minimatch` en dependencias de desarrollo (cadena de ESLint). Solo se arreglan con `--force` (cambios de versión mayores); se dejan así.
