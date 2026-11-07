# Movimiento y 3D

La idea es que el sitio se sienta vivo sin volverse lento ni marear a nadie. Hay **tres escenas 3D decorativas** (hero, servicios y celebración), también en celular, y el resto del movimiento **responde a lo que hace el cliente**: abrir, agregar, filtrar o confirmar. Solo se mueven por su cuenta las escenas 3D y los carruseles, que se pueden pausar, y todo respeta `prefers-reduced-motion`.

Para cualquier decisión visual nueva, usa la skill `frontend-design` (`.claude/skills/frontend-design`).

## 1. Escenas 3D

Hay tres, en `src/compartido/movimiento/3d/`. Todas son decorativas: `aria-hidden="true"`, sin foco ni clics. Cada una carga three solo cuando se va a usar: el catálogo, la ficha, el pedido y la página 404 no lo descargan si no hay celebración.

| Escena | Dónde | Qué pasa |
|---|---|---|
| Hero (`hero.ts`) | Alrededor de la tarjeta del profesional, sobre `paper`, a toda la altura del hero y hasta el borde derecho de la ventana | Cápsulas, pastillas y un frasco de vidrio ámbar flotan y giran. Las más grandes van en primer plano, cortadas por el borde; otras dan la vuelta a la tarjeta, por delante y por detrás de la foto; las más pequeñas quedan al fondo. Parallax de 6° como máximo con el puntero en escritorio y con el scroll en celular |
| Inyectología (`servicios.ts`) | Sección de servicios de la portada | Jeringa y frasco flotan y se inclinan hacia el puntero; cada pocos segundos el émbolo baja y salen gotas |
| Celebración (`celebracion.ts`) | Al llegar al domicilio gratis | Las piezas salen de la barra de progreso y caen con gravedad. Dura menos de 2 s. Al enviar el pedido no hay celebración: WhatsApp se abre de inmediato |

**Cantidad de objetos del hero:** en escritorio, 13 cápsulas (3 grandes, 3 en órbita y 7 al fondo), 8 pastillas (2 grandes) y el frasco: 22 objetos. En celular, 5 cápsulas (2 grandes, 1 en órbita y 2 al fondo), 3 pastillas y el frasco: 9 objetos. Las pastillas son blancas, celadon o bottle.

**Encuadre:** `piezas.ts` define cada pieza en píxeles de pantalla desde un ancla (el centro de la foto o un borde de la ventana), con una escala fija por encuadre. De esa tabla salen la escena y la imagen estática, y la cámara mantiene esa escala en cualquier tamaño: el primer cuadro coincide con la imagen en todos los anchos. No hay animación de entrada; el cambio es un fundido de 300 ms (`motor.ts` y `global.css`). Las capas de la imagen se anclan igual que las piezas: la del fondo, en la foto y debajo de la tarjeta; las de los bordes, encima. Por eso, al arrancar, ninguna pieza anclada a la tarjeta puede estar por delante de ella.

**Implementación:**
- `three` desde npm. Importa solo lo necesario. No uses react-three-fiber.
- `motor.ts` es común a todas las escenas: renderer transparente, cámara, luces, niebla en el color del fondo, ajuste de tamaño y limpieza. `cargador.ts` decide si se cargan y cuándo.
- Hero y servicios son la isla `Escena3d.tsx`, con `client:visible`, que importa cada escena de forma dinámica.
- **Profundidad del hero:** un solo canvas encima de la tarjeta, con `pointer-events:none`. Un plano invisible del tamaño de la tarjeta (`colorWrite: false`) escribe solo profundidad: lo que pasa por detrás queda tapado y lo que pasa por delante se ve sobre la foto. En escritorio las órbitas van a la altura de la foto; en celular, encima y debajo de la tarjeta horizontal. Las del fondo siempre van detrás: las piezas no tapan el texto de la tarjeta.
- Las cápsulas usan `InstancedMesh`: dos, una por mitad, con colores `#133B34`/`#FFFFFF`, `#133B34`/`#D5E5DB` y `#4A5A55`/`#F3F5F1`. Material mate (`roughness` alrededor de 0,4), sin sombras ni postprocesado. El frasco es la excepción aprobada al uso de `amber`.
- `setPixelRatio` con un tope de 1,5. En pantallas chicas o táctiles no hay antialias y las geometrías llevan menos segmentos.
- La escena no afecta la distribución: en celular la banda tiene 220 px fijos y en escritorio el canvas se ubica de forma absoluta sobre el hero, que toma su alto del contenido.
- Se pausa con `IntersectionObserver` cuando la escena sale de pantalla y con `visibilitychange` cuando la pestaña se oculta. Libera la geometría, el material y el renderer al desmontar y al cambiar de página.

**Cuándo NO se carga three.js** (se muestra la imagen estática: en el hero, SVG en línea generados con `scripts/generar-capsulas.mjs` desde la misma tabla; en servicios, su dibujo SVG; la celebración no se dispara):
- `prefers-reduced-motion: reduce`
- `navigator.connection?.saveData === true`
- `navigator.deviceMemory < 2`, cuando el dato exista
- WebGL no disponible o por software (SwiftShader, llvmpipe): sin GPU, compilar los shaders bloquea la página varios segundos

El respaldo es SVG en línea y no una imagen `.webp` para que nunca compita como elemento LCP.

**Carga:** `import()` dinámico en reposo, después del evento `load` y de la primera interacción (mover el puntero, tocar, desplazar o usar el teclado). Hasta entonces se ve la imagen estática. Se probó cargar en reposo justo después de `load`, sin esperar la interacción: Lighthouse móvil dio 77 de Rendimiento con 1070 ms de TBT, contra 100 y 10 ms con la interacción. La celebración se prepara en reposo tras la primera interacción, cuando hay productos en el pedido y aún falta para el domicilio gratis: compila sus shaders y mide 12 cuadros. Si la mediana pasa de 25 ms (40 fps), se libera y no corre. Al dispararse no carga ni compila nada. Ninguna animación bloquea la interfaz.

## 2. Transiciones de interfaz

| Momento | Qué pasa | Duración |
|---|---|---|
| Entrada de la portada (una sola vez) | Las líneas del titular suben 12 px y aparecen en secuencia (60 ms entre una y otra); la tarjeta del profesional sube. La escena 3D llega después, con la primera interacción | ≤ 900 ms en total |
| Cambio de página | View Transitions de Astro (`<ClientRouter />`). Si la navegación entra o sale de la página de un producto, la imagen y el nombre se transforman entre la tarjeta y la ficha; entre listas (portada y catálogo) no, porque cada producto cruzaría por encima de los demás | 280 ms |
| Abrir la ficha rápida | `document.startViewTransition`: la imagen crece desde la tarjeta. Respaldo: escala de 0,96 a 1 con fundido | 240 ms |
| Abrir el buscador | El panel baja 8 px con fundido y el fondo oscuro aparece; al escribir, los resultados cambian con fundido, sin desplazarse | 180 ms |
| Elegir categoría | El anillo del ícono crece y la cuadrícula cambia con View Transition (los productos que siguen se reubican, los nuevos aparecen) | 220 ms |
| Agregar al pedido | El botón «Agregar» se transforma en − / +; un punto de 10 px viaja del botón al contador del pedido (Web Animations API, curva de salida) y el contador late (escala 1 → 1,15 → 1) | 450 ms |
| Barra de domicilio gratis | El ancho avanza suave; al llegar al 100 % el ícono pasa a un check que se dibuja (`stroke-dashoffset`) y aparece «Tu domicilio es gratis» | 400 ms |
| Carruseles (avisos y anuncios) | Deslizamiento horizontal con `scroll-snap`. Avanzan solos cada 6 s; se detienen con el puntero o el foco de teclado encima y con la pestaña oculta. Ninguno tiene botón de pausa; los anuncios muestran chips de posición. Con movimiento reducido, los avisos dejan fijo el primer mensaje y los anuncios no rotan y cambian sin deslizarse | Desplazamiento suave del navegador |
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
- Playwright en escritorio: el canvas del hero aparece con la primera interacción y no antes, tiene `aria-hidden="true"` y no recibe foco ni clics; hay escena en servicios y no hay canvas en el catálogo, la ficha ni la página 404.
- Playwright en celular: en 390×844 el título y un botón se ven sin hacer scroll.
- Playwright: los carruseles avanzan solos y se pueden pausar.
- axe sin violaciones con las animaciones activas y desactivadas.
