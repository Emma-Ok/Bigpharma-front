# Prompts para Claude Code

Pega uno por sesión, en orden. Empieza cada fase en modo plan, revisa el plan y luego aprueba.

## Fase 1: base del proyecto

```
Lee CLAUDE.md, docs/ESPECIFICACION.md y docs/MOVIMIENTO-Y-3D.md completos, carga la skill frontend-design y revisa los mockups en diseno/ (empieza por Contenido.dc.html y Tarjeta.dc.html).
Crea el proyecto Astro + TypeScript + Preact + Tailwind CSS v4 según el stack de CLAUDE.md:
- tokens de diseño en @theme de src/styles/global.css (sección 6) y Lexend con font-display swap
- src/lib/datos.ts que lea datos/productos.csv, lo valide con Zod y exponga los productos tipados
- src/lib/carrito.ts (estado en localStorage con try/catch) y src/lib/whatsapp.ts (mensaje de la sección 2) con pruebas en Vitest
- layout base con barra de avisos, encabezado, pie y enlace para saltar al contenido
Antes de escribir código, muéstrame el plan y la estructura de carpetas.
```

## Fase 2: catálogo y producto

```
Implementa TarjetaProducto, CategoriasIconos, la página /catalogo (filtros, orden y paginación desde la URL) y las páginas estáticas /producto/[slug] con FichaProducto, siguiendo diseno/Catalogo.dc.html, diseno/Tarjeta.dc.html y diseno/Ficha.dc.html.
Agrega JSON-LD Product/Offer (solo venta libre) y BreadcrumbList. Respeta las reglas de contenido sanitario de CLAUDE.md.
```

## Fase 3: inicio

```
Implementa la página / siguiendo diseno/Contenido.dc.html: PresentacionProfesional, CarruselAnuncios y AnuncioLateral (desde la pestaña Anuncios), catálogo resumido en 2 filas, el diálogo del buscador, Servicios, PreguntasFrecuentes y JSON-LD Pharmacy.
```

## Fase 4: pedido

```
Implementa PanelPedido, BarraPedidoMovil con progreso hacia el domicilio gratis (Configuracion.domicilio_gratis_desde) y la página /pedido según diseno/Carrito.dc.html, con el envío a wa.me. Agrega la página de política de datos con un texto base marcado para revisión legal.
```

## Fase 5: datos reales y despliegue

```
Conecta src/lib/datos.ts a las pestañas publicadas como CSV de Google Sheets (URLs en variables de entorno), con respaldo a datos/productos.csv.
Configura Cloudflare Pages, sitemap, robots.txt y URL canónica.
Escribe docs/OPERACION.md: cómo editar la hoja, cómo publicar cambios con el deploy hook y qué revisar antes de publicar.
```

## Fase 6: movimiento y 3D

```
Carga la skill frontend-design y sigue docs/MOVIMIENTO-Y-3D.md:
- tokens de movimiento en @theme y reglas de prefers-reduced-motion en src/styles/global.css
- View Transitions entre páginas con transition:name en imagen y nombre del producto, y startViewTransition al abrir la ficha rápida
- microinteracciones: Agregar → − / + con el punto que viaja al contador, buscador, categorías, carrusel y la barra de domicilio gratis con el check
- la escena de cápsulas flotantes con three.js en el hero de la portada: InstancedMesh, carga diferida, pausa fuera de pantalla, imagen estática de respaldo y las condiciones para no cargarla
Mide el tamaño del chunk de three y el LCP antes y después, y muéstrame los números.
```

## Fase 7: calidad

```
Agrega pruebas de Playwright con @axe-core/playwright para /, /catalogo, una página de producto y /pedido, más un recorrido completo solo con teclado y las pruebas de movimiento de docs/MOVIMIENTO-Y-3D.md (con y sin movimiento reducido). Corrige lo que falle y reporta el resultado de Lighthouse en celular y escritorio.
```
