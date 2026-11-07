# Movimiento y 3D

La idea es que el sitio se sienta vivo sin volverse lento ni marear a nadie. Hay **escenas 3D decorativas en varias vistas**, también en celular, y el resto del movimiento **responde a lo que hace el cliente**: abrir, agregar, filtrar o confirmar. Solo se mueven por su cuenta las escenas 3D y los carruseles, que se pueden pausar, y todo respeta `prefers-reduced-motion`.

Para cualquier decisión visual nueva, usa la skill `frontend-design` (`.claude/skills/frontend-design`).

## 1. Escenas 3D

Todas son decorativas: `aria-hidden="true"`, sin foco ni clics, y ninguna pieza queda detrás de un texto.

| Escena | Dónde | Qué pasa |
|---|---|---|
| Cápsulas y tabletas (`hero`) | Portada | Llegan volando desde el fondo, flotan y se apartan del puntero. Parallax de 6° como máximo. Al hacer scroll, la cámara se aleja y la escena se desvanece |
| Cápsulas y tabletas (`banda`) | Cabecera del catálogo y página 404 | La misma escena con menos piezas; la cámara hace zoom para que se vean del mismo tamaño en un contenedor bajo |
| Inyectología | Sección de servicios de la portada | Jeringa y frasco flotan y se inclinan hacia el puntero; cada pocos segundos el émbolo baja y salen gotas |
| Empaque | Ficha del producto sin foto | Caja, frasco, tubo o paquete con la franja del color de su categoría; gira como en una vitrina y se inclina hacia el puntero |
| Celebración | Al llegar al domicilio gratis y al enviar el pedido | Las piezas salen del botón o la barra y caen con gravedad. Dura menos de 2 s |

**Cantidad de piezas (cápsulas + tabletas):** en la portada, 22 + 10 en escritorio y 10 + 6 en celular; en las bandas, 10 + 5 y 5 + 3. En celular las piezas se ubican en los bordes para no tapar el texto.

**Implementación:**
- `three` desde npm. Importa solo lo necesario. No uses react-three-fiber.
- `src/scripts/3d/motor.ts` es común a todas las escenas: renderer transparente, cámara, luces, niebla en el color del fondo, ajuste de tamaño y limpieza. `src/scripts/3d/cargador.ts` decide si se cargan y cuándo.
- Las cápsulas y tabletas usan `InstancedMesh`: dos por cápsula, una por mitad, con colores `#1E5AA0`/`#FFFFFF`, `#6E9FC4`/`#FFFFFF` y `#D9963F`/`#FBEBD6`. Material mate (`roughness` alrededor de 0,4), sin sombras ni postprocesado.
- `setPixelRatio` con un tope de 1,5 en escritorio y 1,25 en pantallas chicas o táctiles, donde además no hay antialias y las geometrías llevan menos segmentos.
- El canvas va dentro de su contenedor con `position:absolute; inset:0; pointer-events:none` y `aria-hidden="true"`. El texto queda por encima y el titular sigue siendo el LCP.
- Se pausa con `IntersectionObserver` cuando la escena sale de pantalla y con `visibilitychange` cuando la pestaña se oculta. Libera la geometría, el material y el renderer al desmontar y al cambiar de página.

**Cuándo NO se carga three.js** (se muestra la imagen estática, un SVG en línea generado con `scripts/generar-capsulas.mjs` a partir de la misma escena; en servicios y en la ficha, su dibujo SVG):
- `prefers-reduced-motion: reduce`
- `navigator.connection?.saveData === true`
- `navigator.deviceMemory < 2`, cuando el dato exista
- WebGL no disponible

El respaldo es SVG y no una imagen `.webp` porque la imagen pasaba a ser el elemento LCP en lugar del titular.

**Carga:** `import()` dinámico en reposo, después del evento `load` y de la primera interacción (mover el puntero, tocar, desplazar o usar el teclado). Cada escena se monta solo cuando su contenedor está a menos de 300 px de la pantalla. La celebración se carga cuando ocurre la acción. Nunca bloquea el primer render.

## 2. Transiciones de interfaz

| Momento | Qué pasa | Duración |
|---|---|---|
| Entrada de la portada (una sola vez) | Las líneas del titular suben 12 px y aparecen en secuencia (60 ms entre una y otra); la ficha del profesional sube. Las cápsulas llegan después, con la primera interacción | ≤ 900 ms en total |
| Cambio de página | View Transitions de Astro (`<ClientRouter />`); la imagen y el nombre del producto se transforman de la tarjeta a la página (`transition:name="producto-{id}"`) | 280 ms |
| Abrir la ficha rápida | `document.startViewTransition`: la imagen crece desde la tarjeta. Respaldo: escala de 0,96 a 1 con fundido | 240 ms |
| Abrir el buscador | El panel baja 8 px con fundido y el fondo oscuro aparece; al escribir, los resultados cambian con fundido, sin desplazarse | 180 ms |
| Elegir categoría | El anillo del ícono crece y la cuadrícula cambia con View Transition (los productos que siguen se reubican, los nuevos aparecen) | 220 ms |
| Agregar al pedido | El botón «Agregar» se transforma en − / +; un punto de 10 px viaja del botón al contador del pedido (Web Animations API, curva de salida) y el contador late (escala 1 → 1,15 → 1) | 450 ms |
| Barra de domicilio gratis | El ancho avanza suave; al llegar al 100 % el ícono pasa a un check que se dibuja (`stroke-dashoffset`) y aparece «Tu domicilio es gratis» | 400 ms |
| Carruseles (avisos y anuncios) | Deslizamiento horizontal con `scroll-snap`. Avanzan solos cada 6 s; se detienen con el puntero o el foco de teclado encima, con el botón de pausa y con la pestaña oculta. Los anuncios también tienen flechas y puntos. Con movimiento reducido, los avisos dejan fijo el primer mensaje y los anuncios arrancan en pausa y cambian sin deslizarse | Desplazamiento suave del navegador |
| Preguntas y secciones de la ficha | Apertura de `details` con `interpolate-size: allow-keywords` donde exista; sin animación donde no | 200 ms |
| Hover (solo con `pointer: fine`) | En la tarjeta, el borde toma el azul y la imagen del producto escala a 1,03. Nada más | 150 ms |

No hay animaciones de entrada al hacer scroll en el contenido: solo las escenas 3D tienen entrada propia.

## 3. Tokens de movimiento (`@theme` en `src/styles/global.css`)

```css
@theme {
  --transition-duration-rapida: 150ms;
  --transition-duration-media: 240ms;
  --transition-duration-lenta: 420ms;
  --ease-salida: cubic-bezier(.22, .8, .24, 1);
  --ease-entrada: cubic-bezier(.4, 0, .6, 1);
}

/* Fuera de @theme: se queda en CSS */
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-duration-rapida: 0ms;
    --transition-duration-media: 0ms;
    --transition-duration-lenta: 0ms;
  }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
```

En el marcado se usan como utilidades: `transition-colors duration-rapida ease-salida`.

Con movimiento reducido solo se permiten fundidos de opacidad de 120 ms como máximo, sin desplazamientos ni escalas, y no se carga three.js.

## 4. Presupuesto de rendimiento

- JS de la portada sin three.js: ≤ 120 KB gzip. El chunk de three.js (≈ 130 KB gzip) solo se carga con la primera interacción.
- LCP < 2,5 s en 4G, CLS < 0,05, INP < 200 ms.
- Las escenas 3D van a 60 fps en un portátil común; si en las cápsulas el promedio baja de 40 fps durante 2 s, se reducen las piezas a la mitad y se desactiva la respuesta al puntero.
- Lighthouse en celular ≥ 90 en Rendimiento (sin interacción, three.js no se descarga).

## 5. Pruebas

- Playwright con `reducedMotion: 'reduce'`: no existe ningún `<canvas>`, se ve la imagen estática y no se descarga three.js.
- Playwright en escritorio: el canvas de la portada aparece con la primera interacción y no antes, tiene `aria-hidden="true"` y no recibe foco ni clics; también hay escenas en servicios, en el catálogo y en la ficha.
- Playwright: los carruseles avanzan solos y se pueden pausar.
- axe sin violaciones con las animaciones activas y desactivadas.
