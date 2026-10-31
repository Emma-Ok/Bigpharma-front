# Movimiento y 3D

La idea es que el sitio se sienta vivo sin volverse lento ni marear a nadie. Hay **un solo momento 3D**, en la portada, y el resto del movimiento **responde a lo que hace el cliente**: abrir, agregar, filtrar o confirmar. Nada se mueve solo en bucle salvo la escena 3D, y todo respeta `prefers-reduced-motion`.

Para cualquier decisión visual nueva, usa la skill `frontend-design` (`.claude/skills/frontend-design`).

## 1. Escena 3D de la portada: «cápsulas flotantes»

**Qué es:** detrás del titular de la portada flotan entre 14 y 18 cápsulas de dos colores (la forma más reconocible de una farmacia) en los azules de la marca y un toque miel. Giran y derivan muy despacio, y responden un poco al puntero (parallax de 6° como máximo).

**Implementación:**
- `three` desde npm. Importa solo lo necesario: `WebGLRenderer`, `Scene`, `PerspectiveCamera`, `CapsuleGeometry`, `InstancedMesh`, `MeshStandardMaterial`, `HemisphereLight` y `DirectionalLight`. No uses react-three-fiber.
- Cada cápsula usa dos `InstancedMesh`, una por mitad, con colores `#1E5AA0`/`#FFFFFF`, `#6E9FC4`/`#FFFFFF` y `#D9963F`/`#FBEBD6`. Material mate (`roughness` alrededor de 0,45), sin sombras ni postprocesado.
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`, fondo transparente y el canvas dentro del hero con `position:absolute; inset:0; z-index:0; pointer-events:none` y `aria-hidden="true"`. El texto queda por encima y sigue siendo el LCP.
- Se pausa con `IntersectionObserver` cuando el hero sale de pantalla y con `visibilitychange` cuando la pestaña se oculta. Libera la geometría, el material y el renderer al desmontar.
- Al hacer scroll, la escena baja su opacidad hasta 0 en los primeros 400 px.

**Cuándo NO se carga three.js** (se muestra `hero-capsulas.webp`, una imagen estática renderizada de la misma escena):
- `prefers-reduced-motion: reduce`
- ancho menor a 768 px
- `navigator.connection?.saveData === true`
- `navigator.deviceMemory < 4`, cuando el dato exista
- WebGL no disponible

**Carga:** `import()` dinámico dentro de `requestIdleCallback`, después del evento `load`. Nunca bloquea el primer render.

## 2. Transiciones de interfaz

| Momento | Qué pasa | Duración |
|---|---|---|
| Entrada de la portada (una sola vez) | Las líneas del titular suben 12 px y aparecen en secuencia (60 ms entre una y otra); la ficha del profesional sube; luego aparecen las cápsulas | ≤ 900 ms en total |
| Cambio de página | View Transitions de Astro (`<ClientRouter />`); la imagen y el nombre del producto se transforman de la tarjeta a la página (`transition:name="producto-{id}"`) | 280 ms |
| Abrir la ficha rápida | `document.startViewTransition`: la imagen crece desde la tarjeta. Respaldo: escala de 0,96 a 1 con fundido | 240 ms |
| Abrir el buscador | El panel baja 8 px con fundido y el fondo oscuro aparece; al escribir, los resultados cambian con fundido, sin desplazarse | 180 ms |
| Elegir categoría | El anillo del ícono crece y la cuadrícula cambia con View Transition (los productos que siguen se reubican, los nuevos aparecen) | 220 ms |
| Agregar al pedido | El botón «Agregar» se transforma en − / +; un punto de 10 px viaja del botón al contador del pedido (Web Animations API, curva de salida) y el contador late (escala 1 → 1,15 → 1) | 450 ms |
| Barra de domicilio gratis | El ancho avanza suave; al llegar al 100 % el ícono pasa a un check que se dibuja (`stroke-dashoffset`) y aparece «Tu domicilio es gratis» | 400 ms |
| Carrusel de anuncios | Fundido cruzado con 12 px de desplazamiento en la dirección elegida | 280 ms |
| Preguntas y secciones de la ficha | Apertura de `details` con `interpolate-size: allow-keywords` donde exista; sin animación donde no | 200 ms |
| Hover (solo con `pointer: fine`) | En la tarjeta, el borde toma el azul y la imagen del producto escala a 1,03. Nada más | 150 ms |

No hay animaciones de entrada al hacer scroll en cada sección: ya tenemos un solo momento de entrada.

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

- JS de la portada sin three.js: ≤ 120 KB gzip. El chunk de three.js (≈ 150 KB gzip) solo se carga en escritorio y en diferido.
- LCP < 2,5 s en 4G, CLS < 0,05, INP < 200 ms.
- La escena 3D va a 60 fps en un portátil común; si el promedio baja de 40 fps durante 2 s, reduce las cápsulas a la mitad y desactiva el parallax.
- Lighthouse en celular ≥ 90 en Rendimiento (en celular la escena ni se descarga).

## 5. Pruebas

- Playwright con `reducedMotion: 'reduce'`: no existe `<canvas>` en el hero y se ve la imagen estática.
- Playwright en escritorio: el canvas existe, tiene `aria-hidden="true"` y no recibe foco ni clics.
- axe sin violaciones con las animaciones activas y desactivadas.
