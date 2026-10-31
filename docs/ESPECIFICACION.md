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

Medicamentos con fórmula: botón «Enviar fórmula por WhatsApp» con mensaje «Hola, quiero consultar por <producto>. Te envío la foto de mi fórmula.».

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
| `/catalogo` | Ruta de navegación, `h1`, buscador, filtros (categoría con conteo, tipo, solo con descuento), orden, cuadrícula paginada |
| `/catalogo?categoria=piel` | Mismo catálogo con filtro inicial desde la URL |
| `/producto/[slug]` | Página estática con el contenido de la ficha (SEO). Desde el catálogo también se abre como diálogo de vista rápida |
| `/pedido` | Resumen editable, formulario, vista previa del mensaje y envío a WhatsApp (`noindex`) |
| `/politica-de-datos`, `/terminos` | Textos legales |

## 5. Componentes

- **BarraAvisos:** mensajes de `Configuracion.aviso_1..3` con flechas anterior y siguiente, sin rotación automática; en escritorio, WhatsApp a la derecha.
- **Encabezado:** marca, navegación (Catálogo, Inyectables a domicilio, Preguntas frecuentes), botón de lupa que abre el buscador y botón de WhatsApp. En celular, menú desplegable (`aria-expanded`).
- **PresentacionProfesional:** foto retrato grande (320–400 px de alto, `object-position: center 22%`), ficha superpuesta con nombre (`h2`), profesión, registro profesional, frase en primera persona y «Escríbeme por WhatsApp». Debajo: inscripción de la droguería, horario y domicilio.
- **CarruselAnuncios + AnuncioLateral:** título y texto en HTML (no dentro de la imagen), foto con `alt`, flechas y puntos accesibles, sin autoplay.
- **Buscador (diálogo):** se abre desde el campo del catálogo o la lupa. Campo con botón de buscar y ✕; a la izquierda categorías y «Lo más buscado»; a la derecha «Productos destacados» o «Resultados para «…» (n)» con flechas. Búsqueda sin tildes por nombre, categoría y síntomas (palabras clave por categoría). Esc cierra y devuelve el foco.
- **CategoriasIconos:** fila de botones circulares con ícono y nombre (`aria-pressed`); en celular se desliza horizontalmente.
- **TarjetaProducto:** imagen, insignia («Con fórmula médica», «Ahorra 15 %», «Agotado»), categoría, nombre (enlace a la ficha), presentación, precio y «Antes», y botón «Agregar» que pasa a − / +. Para fórmula: «Consultar por WhatsApp». Agotado: «Preguntar disponibilidad».
- **FichaProducto:** galería (hasta 4 fotos), condición de venta, disponibilidad, precio, precio por unidad, acciones, secciones desplegables (Para qué sirve, Cómo se usa, Advertencias), tabla «Información del producto» y leyenda obligatoria.
- **PanelPedido / BarraPedidoMovil:** líneas, subtotal y progreso hacia el domicilio gratis («Te faltan $X para el domicilio gratis», `role="progressbar"`).
- **Servicios (inyectología):** texto, requisito de orden médica, pasos 1-2-3 y «Agendar visita» (WhatsApp con mensaje prellenado).
- **PreguntasFrecuentes:** `details/summary`.
- **Pie:** horario, cobertura, WhatsApp, medios de pago, enlaces legales, razón social, NIT y código de inscripción.

## 6. Diseño (tokens)

Los tokens van en `@theme` dentro de `src/styles/global.css` (Tailwind CSS v4 con `@tailwindcss/vite`, sin `tailwind.config.js`). Cada token genera sus utilidades: `--color-azul` da `bg-azul`, `text-azul`, `border-azul`, `ring-azul`, etc. `@theme` empieza con `--color-*: initial`, así que la paleta por defecto de Tailwind (`bg-blue-600`, `bg-white`) no existe. No se usan valores arbitrarios de color (`bg-[#1E5AA0]`): si hace falta un color nuevo, se agrega en esta sección y en `global.css`. Las transparencias usan el modificador de opacidad sobre un token (`bg-tinta/45` para el fondo de un diálogo).

### Color

| Token | Valor | Utilidad | Uso |
|---|---|---|---|
| `--color-azul` | `#1E5AA0` | `bg-azul`, `text-azul` | Botones, enlaces, selección |
| `--color-azul-oscuro` | `#173F72` | `bg-azul-oscuro` | Barra de avisos |
| `--color-azul-claro` | `#EAF2FB` | `bg-azul-claro` | Fondos de sección y pie |
| `--color-tinta` | `#1B2A3A` | `text-tinta` | Texto principal |
| `--color-texto-cuerpo` | `#3B4A5A` | `text-texto-cuerpo` | Párrafos largos (hero, anuncios, preguntas) |
| `--color-texto-2` | `#52606F` | `text-texto-2` | Texto secundario (≥ 4,5:1 sobre blanco y azul claro) |
| `--color-borde` | `#D5DFEA` | `border-borde` | Bordes de paneles y campos |
| `--color-borde-suave` | `#E4EAF1` | `border-borde-suave` | Bordes de tarjetas y separadores |
| `--color-borde-control` | `#C5D3E2` | `border-borde-control` | Bordes de botones secundarios y chips (unifica el `#A9BCD0` de los mockups) |
| `--color-miel` | `#FBEBD6` | `bg-miel` | Sección de servicios y anuncios cálidos |
| `--color-formula` | `#7B3F5E` | `text-formula`, `bg-formula` | Medicamentos con fórmula |
| `--color-formula-fondo` | `#F6E9EF` | `bg-formula-fondo` | Fondo de medicamentos con fórmula |
| `--color-descuento` | `#8A4B14` | `bg-descuento` | Insignia de ahorro |
| `--color-blanco` | `#FFFFFF` | `bg-blanco`, `text-blanco` | Fondo de página y tarjetas, texto sobre azul |

Colores por categoría (punto, ícono y fondo del ícono). Son decorativos: nunca se usan para texto, porque varios no llegan a 4,5:1.

| Categoría | Color | Fondo |
|---|---|---|
| dolor | `--color-cat-dolor` `#D9963F` | `--color-cat-dolor-fondo` `#FBEBD6` |
| gripa | `--color-cat-gripa` `#6E9FC4` | `--color-cat-gripa-fondo` `#E4EEF6` |
| estómago | `--color-cat-estomago` `#7FB08F` | `--color-cat-estomago-fondo` `#E5F0E8` |
| piel | `--color-cat-piel` `#E7B9A0` | `--color-cat-piel-fondo` `#FBE8DE` |
| bebés | `--color-cat-bebes` `#B9A6D8` | `--color-cat-bebes-fondo` `#EEE9F7` |
| primeros auxilios | `--color-cat-auxilios` `#1E5AA0` | `--color-cat-auxilios-fondo` `#EAF2FB` |
| fórmula | `--color-cat-formula` `#7B3F5E` | `--color-cat-formula-fondo` `#F6E9EF` |
| todo | `--color-cat-todo` `#52606F` | `--color-cat-todo-fondo` `#F1F4F8` |

Utilidades: `bg-cat-piel`, `bg-cat-piel-fondo`, `text-cat-piel` (solo en íconos SVG con `currentColor`).

### Combinaciones de texto y fondo permitidas

Solo estas combinaciones llevan texto. Todas cumplen WCAG 2.2 AA (≥ 4,5:1, contraste medido con la fórmula de luminancia relativa).

| Texto | Fondos permitidos (contraste) |
|---|---|
| `text-tinta` | `blanco` 14,59; `azul-claro` 12,92; `miel` 12,48; `formula-fondo` 12,38; cualquier `cat-*-fondo` ≥ 12,26 |
| `text-texto-cuerpo` | `blanco` 9,08; `azul-claro` 8,04; `miel` 7,76; `formula-fondo` 7,70; cualquier `cat-*-fondo` ≥ 7,62 |
| `text-texto-2` | `blanco` 6,44; `azul-claro` 5,70; `miel` 5,51; `formula-fondo` 5,46; cualquier `cat-*-fondo` ≥ 5,41 |
| `text-azul` | `blanco` 6,94; `azul-claro` 6,15; `miel` 5,94; `formula-fondo` 5,89 |
| `text-azul-oscuro` | `blanco` 10,55; `azul-claro` 9,34; `miel` 9,02 |
| `text-formula` | `blanco` 7,74; `formula-fondo` 6,56 |
| `text-descuento` | `blanco` 6,78; `miel` 5,80 |
| `text-blanco` | `tinta` 14,59; `azul-oscuro` 10,55; `formula` 7,74; `azul` 6,94; `descuento` 6,78; `texto-2` 6,44 |

- No hay texto de un color de marca sobre otro (por ejemplo, `azul` sobre `azul-oscuro` da 1,52:1) ni `blanco` sobre fondos claros (≤ 1,19:1).
- Los colores de categoría sin `-fondo` (`cat-dolor`, `cat-gripa`, `cat-estomago`, `cat-piel`, `cat-bebes`, `cat-auxilios`, `cat-formula`, `cat-todo`) son **solo decorativos**: puntos, íconos y rellenos de ilustración. Sobre blanco van de 1,77:1 a 2,83:1, así que nunca llevan texto ni son la única señal de un estado.
- Bordes: `borde`, `borde-suave` y `borde-control` son decorativos. Cuando el borde es lo único que delimita un control (un campo de texto), usa `border-texto-2` (6,44:1 sobre blanco) para cumplir el 3:1 de contraste no textual.
- Foco visible: contorno `tinta` sobre fondos claros y `blanco` sobre `azul-oscuro` (barra de avisos) o `azul`.

### Tipografía

`--font-sans: "Lexend Variable", "Lexend", system-ui, sans-serif`, que Tailwind usa como fuente por defecto del sitio. Lexend se sirve desde el propio sitio con `@fontsource-variable/lexend` (un archivo variable; se precarga el subconjunto latino). Lexend en 400, 500, 600 y 700 (`font-normal`, `font-medium`, `font-semibold`, `font-bold`) con `font-display: swap`; cuerpo de 16 px (`text-base`).

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

Columnas del catálogo: 2 (celular), 3, 4 y 5 (≥ 1200 px): `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`.

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

Ver `docs/MOVIMIENTO-Y-3D.md`: escena de cápsulas flotantes con three.js en la portada (solo escritorio, carga diferida, imagen estática de respaldo) y transiciones que responden a las acciones del cliente (View Transitions entre páginas y al abrir la ficha, agregar al pedido, buscador, categorías, domicilio gratis).

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
- La escena 3D no afecta el LCP (el elemento LCP es el titular) y se pausa fuera de pantalla.
