# Especificación: droguería a domicilio

## 1. Objetivo

Que los vecinos encuentren rápido un producto, armen su pedido y lo envíen por WhatsApp, con la confianza de que los atiende un profesional de la salud registrado. Volumen esperado: hasta 18 pedidos al día.

## 2. Flujo del pedido

1. El cliente busca o navega el catálogo y agrega productos (venta libre).
2. El carrito vive en el navegador y se ve en todas las páginas: barra inferior en celular y panel lateral en escritorio.
3. En «Tu pedido» llena nombre, barrio y dirección, y forma de pago, y acepta la política de datos.
4. «Enviar pedido por WhatsApp» abre `https://wa.me/<whatsapp>?text=<mensaje codificado>`.
5. El profesional confirma disponibilidad y total con domicilio por el chat y cobra.

Mensaje (texto plano, `encodeURIComponent`):

```
Hola, quiero hacer este pedido:
• 2 × Acetaminofén 500 mg: $7.000
• 1 × Suero oral: $6.200
Subtotal: $13.200
Nombre: …
Dirección: …
Pago: Nequi
```

Medicamentos con fórmula: botón «Enviar fórmula por WhatsApp» en la ficha y «Enviar mi fórmula» en la tarjeta, con mensaje «Hola, quiero consultar por <producto>. Te envío la foto de mi fórmula.».

## 3. Fuentes de datos (Google Sheets)

Plantilla en `datos/catalogo_productos.xlsx`. Se sube a Google Drive como Google Sheets y se publica cada pestaña como CSV.

- **Productos:** columnas y reglas en la pestaña «Diccionario». `precio_por_unidad` y `descuento` son calculadas: el sitio las recalcula y no las lee.
- **Anuncios:** carrusel principal (`ubicacion = carrusel`) y anuncio lateral (`lateral`). Solo los que tengan `activo = si`.
- **Configuracion:** pares clave-valor (WhatsApp, `domicilio_gratis_desde`, avisos de la barra superior, datos del profesional, horario, zonas).

En build: descargar los CSV, validarlos con Zod y fallar el build con un mensaje claro si falta un campo obligatorio. Si no hay red en desarrollo, usar `datos/productos.csv`.

Slug del producto: `nombre` normalizado (sin tildes, minúsculas, guiones) + `id` si hay colisión.

## 4. Páginas

| Ruta | Contenido |
|---|---|
| `/` | Barra de avisos, encabezado, hero con presentación del profesional, anuncios, catálogo resumido (2 filas), inyectología, preguntas frecuentes, pie |
| `/catalogo` | Ruta de navegación, `h1` y búsqueda, categorías, botón «Filtros» (tipo, solo con descuento y orden), cuadrícula paginada y panel del pedido |
| `/catalogo?categoria=piel` | Mismo catálogo con filtro inicial desde la URL |
| `/producto/[slug]` | Página estática con el contenido de la ficha (SEO). Desde el catálogo también se abre como diálogo de vista rápida |
| `/pedido` | «Seguir comprando» (ruta de navegación desde 768 px), resumen editable, formulario, vista previa del mensaje y envío a WhatsApp (`noindex`) |
| `/politica-de-datos`, `/terminos` | Textos legales |

**Volver a la página superior.** Por debajo de 768 px, arriba del contenido y fuera del encabezado, un solo enlace con chevron que nombra el destino: en el catálogo «Inicio»; en la ficha «Catálogo», o el nombre de la categoría si se llegó desde ella; en `/pedido` «Seguir comprando». Desde 768 px se ve la ruta de navegación completa (en `/pedido`, «Inicio / Tu pedido»). El enlace nunca usa `history.back()`: siempre lleva a la página superior del sitio, también si se llega desde Google o WhatsApp. Al volver al catálogo se conservan la búsqueda, la categoría, los filtros y la página, que el catálogo guarda en `sessionStorage` con los mismos parámetros de su URL. Área táctil de 44 px.

## 5. Componentes

- **BarraAvisos:** mensajes de `Configuracion.aviso_1..3`, de máximo 42 caracteres (si se pasan, el build dice cuáles), sin flechas ni puntos. Por debajo de 768 px van en una sola línea de 14 px. Avanza solo cada 6 s y se detiene con el puntero o el foco encima y con la pestaña oculta. No tiene botón de pausa. Con movimiento reducido, solo el primer mensaje, fijo. En escritorio, WhatsApp a la derecha; en celular no se muestra.
- **Encabezado:** marca, navegación (Catálogo, Inyectables a domicilio, Preguntas frecuentes), botón de lupa que abre el buscador y botón de WhatsApp. En celular, menú desplegable (`aria-expanded`). Por debajo de 768 px mide como máximo 64 px de alto: nombre en una línea de 17 px, con elipsis, y sin subtítulo.
- **Hero y PresentacionProfesional:** título con la profesión de la hoja y su artículo («Tus medicamentos, revisados por una química farmacéutica»; si falta el dato, «un químico farmacéutico»), subtítulo, botones y las tres líneas de datos de la droguería: inscripción, horario y domicilio. A la derecha, sobre `paper` y sin caja, la tarjeta del profesional (360 px de ancho): foto con `object-position: center 22%`, nombre en `h2`, profesión, registro y frase en primera persona (máximo 90 caracteres: si se pasa, el build avisa). La escena 3D la rodea, a toda la altura del hero y hasta el borde derecho de la ventana. En celular la escena es una banda de 220 px a todo el ancho (200 px, y el título un paso más chico, por debajo de 380 px), arriba, con la tarjeta horizontal: foto circular de 72 px, nombre y registro; debajo van el título, los botones a ancho completo y la frase. En 390×844, el título completo y «Ver catálogo» se ven sin hacer scroll, también con productos en el pedido. La foto lleva `fetchpriority="high"`.
- **CarruselAnuncios + AnuncioLateral:** título y texto en HTML (no dentro de la imagen), foto con `alt`. Avanza solo cada 6 s y se detiene con el puntero o el foco encima y con la pestaña oculta. No tiene flechas ni botón de pausa: unos chips pequeños muestran cuántos anuncios hay y en cuál va. Se desliza con el dedo y, con el foco dentro, con las flechas del teclado. Con movimiento reducido no rota.
- **Buscador (diálogo):** se abre desde el campo del catálogo o la lupa. Campo con botón de buscar y ✕; a la izquierda categorías y «Lo más buscado»; a la derecha «Productos destacados» o «Resultados para «…» (n)» con flechas. Búsqueda sin tildes por nombre, categoría y síntomas (palabras clave por categoría). Esc cierra y devuelve el foco.
- **CategoriasIconos:** fila de botones circulares con ícono y nombre (`aria-pressed`); debajo de 1200 px se desliza horizontalmente con snap.
- **TarjetaProducto:** imagen, insignia («Con fórmula médica», «Ahorra 15 %», «Agotado»), categoría, nombre (enlace a la ficha), presentación, precio y «Antes», alineados al fondo, y `AccionProducto`: «Agregar» que pasa a − cantidad +. Para fórmula: «Enviar mi fórmula» en ámbar. Agotado: «Preguntar disponibilidad».
- **FichaProducto:** galería (hasta 4 fotos), condición de venta, disponibilidad, precio, precio por unidad, acciones, secciones desplegables (Para qué sirve, Cómo se usa, Advertencias), tabla «Información del producto» y leyenda obligatoria.
- **Distribución del catálogo:** desde 1200 px, título y búsqueda en una fila, categorías, cuadrícula de 3 columnas y panel «Tu pedido» sticky a la derecha. Por debajo, la búsqueda es sticky, la cuadrícula tiene 2 columnas hasta 599 px y 3 desde 600 px, y el panel pasa a la barra inferior.
- **PanelPedido / BarraPedidoMovil / HojaInferior:** el panel y la hoja muestran el subtotal, la vista previa del mensaje en una burbuja `celadon`, con [tu nombre], [tu barrio y dirección] y [tu forma de pago] por llenar, el progreso hacia el domicilio gratis («Te faltan $X para domicilio gratis», `role="progressbar"`) y «Continuar con mis datos», que lleva a `/pedido`: ese botón todavía no envía nada. «Enviar pedido por WhatsApp» solo está en `/pedido`, junto con la autorización de la Ley 1581, y abre WhatsApp en el mismo evento del clic, sin animación previa. La barra inferior («3 productos · $49.000», «Ver pedido», y debajo el texto y la línea de progreso, dentro de la barra) solo aparece con productos, abre la hoja y reserva su altura al final de la página.
- **Filtros:** el botón «Filtros» abre una hoja inferior en celular y un diálogo desde 1200 px, con tipo, descuento y orden. Las categorías están en los íconos.
- **Boton:** `compartido/ui/Boton.tsx`, con variantes `primario`, `secundario` y `formula`, y tamaños `compacto`, `normal` y `grande`.
- **Servicios (inyectología):** texto, requisito de orden médica, pasos 1-2-3 y «Agendar visita» (WhatsApp con mensaje prellenado).
- **PreguntasFrecuentes:** `details/summary`.
- **Pie:** horario, cobertura, WhatsApp, medios de pago, enlaces legales, razón social, NIT y código de inscripción.

## 6. Diseño (tokens)

Los tokens van en `@theme` dentro de `src/styles/global.css` (Tailwind CSS v4 con `@tailwindcss/vite`, sin `tailwind.config.js`). Cada token genera sus utilidades: `--color-bottle` da `bg-bottle`, `text-bottle`, `border-bottle`, `ring-bottle`, etc. `@theme` empieza con `--color-*: initial`, así que la paleta por defecto de Tailwind (`bg-blue-600`, `bg-white`) no existe. No se usan valores arbitrarios de color (`bg-[#133B34]`): si hace falta un color nuevo, se agrega en esta sección y en `global.css`. Las transparencias usan el modificador de opacidad sobre un token (`bg-ink/45` para el fondo de un diálogo).

### Color

| Token | Valor | Utilidad | Uso |
|---|---|---|---|
| `--color-paper` | `#F3F5F1` | `bg-paper` | Fondo general |
| `--color-bottle` | `#133B34` | `bg-bottle`, `text-bottle` | Botones primarios, títulos, enlaces, barra de avisos |
| `--color-celadon` | `#D5E5DB` | `bg-celadon`, `border-celadon` | Fondos suaves, burbuja del pedido, bordes decorativos. Dentro de un control, solo marca lo seleccionado |
| `--color-amber` | `#A8621A` | `bg-amber` | **Solo** fórmula y descuentos: etiquetas y botones, con texto blanco. Excepción aprobada: el frasco de vidrio del hero |
| `--color-amber-ink` | `#8A4E12` | `text-amber-ink` | **Solo** fórmula y descuentos, cuando el ámbar es texto sobre fondo claro (precio antes, enlaces de fórmula) |
| `--color-ink` | `#1C2623` | `text-ink` | Texto principal |
| `--color-muted` | `#4A5A55` | `text-muted`, `border-muted` | Texto secundario y bordes de controles |
| `--color-error` | `#A3312A` | `text-error`, `border-error` | **Solo** errores de formulario: borde del campo, texto e ícono |
| `--color-blanco` | `#FFFFFF` | `bg-blanco`, `text-blanco` | Tarjetas, paneles y campos; texto sobre `bottle` y `amber` |

Las categorías no tienen tokens propios (`src/compartido/ui/estilosCategoria.ts`): el fondo del ícono es `celadon`, el punto y los rellenos son `bottle`, y en la categoría de fórmula pasan a `amber`. Son decorativos y nunca llevan texto. La categoría seleccionada lleva círculo `bottle` relleno con el ícono en `blanco`.

### Combinaciones de texto y fondo permitidas

Solo estas combinaciones llevan texto. Todas cumplen WCAG 2.2 AA (≥ 4,5:1, contraste medido con la fórmula de luminancia relativa).

| Texto | Fondos permitidos (contraste) |
|---|---|
| `text-ink` | `blanco` 15,55; `paper` 14,17; `celadon` 11,89 |
| `text-muted` | `blanco` 7,28; `paper` 6,64; `celadon` 5,57 |
| `text-bottle` | `blanco` 12,33; `paper` 11,24; `celadon` 9,43 |
| `text-amber-ink` | `blanco` 6,61; `paper` 6,02; `celadon` 5,05 |
| `text-error` | `blanco` 6,93; `paper` 6,32 |
| `text-blanco` | `bottle` 12,33; `ink` 15,55; `muted` 7,28; `amber` 4,74 |
| `text-paper` | `bottle` 11,24 |
| `text-celadon` | `bottle` 9,43 |

- `amber` nunca es color de texto: sobre `paper` da 4,32:1 y sobre `celadon` 3,63:1. Para texto se usa `amber-ink`.
- Los errores de formulario van en `error` con ícono y texto, y el fondo del campo sigue blanco: el color nunca es la única señal. «Quitar», «Vaciar pedido» y «Quedan pocas unidades» van en `ink`; esta última lleva ícono de aviso.
- Bordes: `celadon` y `muted/40` son decorativos. Cuando el borde es lo único que delimita un control (un campo de texto), usa `border-muted` (7,28:1 sobre blanco) para cumplir el 3:1 de contraste no textual.
- Foco visible: contorno `ink` sobre fondos claros y `blanco` sobre `bottle`.

### Tipografía

`--font-sans: "Lexend Variable", "Lexend Fallback", "Lexend", system-ui, sans-serif`, que Tailwind usa como fuente por defecto del sitio. «Lexend Fallback» es una fuente local ajustada con `size-adjust` a las métricas de Lexend, para que el cambio de fuente no mueva el contenido (CLS). Lexend se sirve desde el propio sitio con `@fontsource-variable/lexend` (un archivo variable; se precarga el subconjunto latino). Lexend en 400, 500, 600 y 700 (`font-normal`, `font-medium`, `font-semibold`, `font-bold`) con `font-display: swap`; cuerpo de 16 px (`text-base`).

### Forma, medida y sombra

| Token | Valor | Utilidad | Uso |
|---|---|---|---|
| `--radius-boton` | `12px` | `rounded-boton` | Botones y campos |
| `--radius-tarjeta` | `16px` | `rounded-tarjeta` | Tarjetas de producto |
| `--radius-panel` | `20px` | `rounded-panel` | Paneles, anuncios, pedido |
| `--radius-panel-grande` | `24px` | `rounded-panel-grande` | Retrato del profesional |
| `--container-sitio` | `1280px` | `max-w-sitio` | Ancho máximo del contenido |
| `--spacing-margen` | `clamp(16px, 4vw, 32px)` | `px-margen` | Margen lateral |
| `--shadow-ficha` | `0 14px 36px rgb(23 63 114 / 0.18)` | `shadow-ficha` | Ficha del profesional sobre la foto |
| `--shadow-flotante` | `0 18px 48px rgb(27 42 58 / 0.18)` | `shadow-flotante` | Panel del buscador y diálogos |
| `--shadow-barra` | `0 -8px 24px rgb(27 42 58 / 0.08)` | `shadow-barra` | Barra del pedido en celular |

Puntos de corte (los de los mockups, reemplazan los de Tailwind con el mismo nombre):

| Token | Valor | Variante | Uso |
|---|---|---|---|
| `--breakpoint-sm` | `37.5rem` (600 px) | `sm:` | 3 columnas |
| `--breakpoint-md` | `56.25rem` (900 px) | `md:` | 4 columnas |
| `--breakpoint-lg` | `75rem` (1200 px) | `lg:` | Escritorio: navegación completa, panel del pedido, 5 columnas |

Columnas del catálogo: 2 hasta 599 px y 3 desde 600 px: `grid-cols-2 sm:grid-cols-3`.

Variante propia `hover-fino:`: hover solo con `pointer: fine` (docs/MOVIMIENTO-Y-3D.md).

### Tokens de movimiento

| Token | Valor | Utilidad |
|---|---|---|
| `--transition-duration-rapida` | `150ms` | `duration-rapida` |
| `--transition-duration-media` | `240ms` | `duration-media` |
| `--transition-duration-lenta` | `420ms` | `duration-lenta` |
| `--ease-salida` | `cubic-bezier(.22, .8, .24, 1)` | `ease-salida` |
| `--ease-entrada` | `cubic-bezier(.4, 0, .6, 1)` | `ease-entrada` |

En Tailwind v4 las duraciones van en el espacio `--transition-duration-*`: con `--duration-*` no se generan utilidades. Las animaciones con Web Animations API leen estas mismas variables con `getComputedStyle(document.documentElement)`.

### Lo que se queda en CSS

En `global.css`, fuera de `@theme`, van la regla de movimiento reducido y los estilos de View Transitions (`::view-transition-*`, ver `docs/MOVIMIENTO-Y-3D.md`). La regla funciona porque Tailwind genera las utilidades como `var(--transition-duration-media)`: al poner las variables en 0, todas las transiciones se detienen.

### Movimiento y 3D

Ver `docs/MOVIMIENTO-Y-3D.md`: escenas 3D con three.js en el hero, en los servicios y en la celebración del domicilio gratis (también en celular, cada una cargada cuando se va a usar, con imagen estática de respaldo y sin cargar nada si no hay GPU) y transiciones que responden a las acciones del cliente (View Transitions entre páginas y al abrir la ficha, agregar al pedido, buscador, categorías, domicilio gratis).

## 7. Cómo leer los mockups (`diseno/`)

Son prototipos del canvas de diseño (formato `.dc.html`): marcado HTML con estilos en línea, `{{variables}}`, `<sc-if>`/`<sc-for>` para condiciones y listas, y la lógica en el `<script type="text/x-dc">` de cada archivo. No se ejecutan fuera del canvas: úsalos como referencia de estructura, copys, estilos y comportamiento, y reimplementa en Astro + Preact. Los estilos en línea se traducen a utilidades de los tokens de la sección 6; si un color del mockup no tiene token, usa el más cercano o agrega el token en esa sección.

| Archivo | Qué es |
|---|---|
| `Contenido.dc.html` | Página de inicio completa (celular y escritorio en el mismo archivo) |
| `Catalogo.dc.html` | Página de catálogo |
| `Tarjeta.dc.html` | Tarjeta de producto |
| `Ficha.dc.html` | Ficha / detalle del producto |
| `Carrito.dc.html` | Página del pedido |
| `Main`, `Web`, `CatalogoMovil` | Marcos de celular y escritorio (solo envoltorios) |

## 8. Criterios de aceptación

- Lighthouse ≥ 95 en Accesibilidad, SEO y Buenas prácticas; ≥ 90 en Rendimiento en celular.
- 0 violaciones de axe en `/`, `/catalogo`, `/producto/*` y `/pedido`.
- Todo el flujo funciona solo con teclado.
- El mensaje de WhatsApp coincide con el formato de la sección 2 (prueba unitaria).
- Cambiar un precio en la hoja y ejecutar el deploy hook lo refleja en el sitio.
- Con `prefers-reduced-motion: reduce` no hay desplazamientos ni escalas y no se descarga three.js.
- Las escenas 3D no afectan el LCP: el canvas nunca es el elemento LCP, que es la foto del profesional o el titular. Se pausan fuera de pantalla.
