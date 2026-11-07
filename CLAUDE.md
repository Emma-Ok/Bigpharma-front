# Droguería a domicilio: reglas del proyecto

Sitio web de una droguería de barrio que vende a domicilio y ofrece inyectología en casa. El pedido se arma en la web y se envía por WhatsApp; no hay pasarela de pago ni cuentas de usuario.

Lee `docs/ESPECIFICACION.md` antes de cualquier tarea. Los mockups de referencia están en `diseno/` (ver «Cómo leer los mockups» en la especificación).

## Stack

- Astro (salida estática) + TypeScript. Islas interactivas con Preact solo donde hace falta (buscador, carrito, carrusel, filtros, ficha).
- Estilos: Tailwind CSS v4 con el plugin oficial de Vite (`@tailwindcss/vite`), sin `tailwind.config.js`. Los tokens van en `@theme` dentro de `src/styles/global.css`. Sin librerías de componentes de UI.
- Datos: Google Sheets publicado como CSV, leído **en build** (`src/lib/datos.ts`). Copia local de respaldo en `datos/productos.csv` para desarrollo sin red.
- Carrito: estado en el navegador (`localStorage`, con try/catch) compartido entre páginas.
- Movimiento: View Transitions de Astro (`<ClientRouter />`), CSS y Web Animations API. `three` para las escenas 3D decorativas (portada, servicios, cabeceras, ficha sin foto y celebraciones), cargado con la primera interacción. Detalle en `docs/MOVIMIENTO-Y-3D.md`.
- Despliegue: Cloudflare Pages. Un deploy hook reconstruye el sitio cuando cambia la hoja.

## Entorno

Todo se ejecuta **dentro del contenedor** `web` de Docker Compose (proyecto `bigpharma`, Node 24 LTS). No instales Node ni paquetes en WSL ni corras `npm` o `npx` fuera del contenedor.

- Levantar (servidor en http://localhost:4321 con recarga automática): `docker compose up -d`
- Ver el registro del servidor: `docker compose logs -f web`
- Detener: `docker compose down` (conserva `node_modules`; `docker compose down -v` borra también los volúmenes)
- Instalar dependencias después de cambiar `package.json`: `docker compose run --rm web npm install`
- Agregar una dependencia: `docker compose run --rm web npm install <paquete>`
- Correr un script con el contenedor arriba: `docker compose exec web npm run build` (igual con `check` y `test`)
- Correr un script sin levantar el servidor: `docker compose run --rm web npm run test`
- Reconstruir la imagen después de cambiar el `Dockerfile`: `docker compose build`
- Pruebas de navegador (fase de pruebas, imagen oficial de Playwright): `docker compose --profile pruebas run --rm pruebas`

## Comandos

Se corren dentro del contenedor (ver «Entorno»).

- `npm run dev`: desarrollo
- `npm run build`: build estático
- `npm run check`: `astro check` + ESLint (con reglas de accesibilidad) + `scripts/revisar-tokens.mjs` (falla con colores arbitrarios)
- `npm run test`: Vitest (lógica de `src/lib/`)
- `npm run test:e2e`: Playwright + axe contra el build de producción; corre en el servicio `pruebas` (`docker compose --profile pruebas run --rm pruebas`)

## Diseño

- Para cualquier decisión visual (composición, tipografía, color, movimiento, nuevos componentes) carga y sigue la skill `frontend-design` en `.claude/skills/frontend-design`. Los tokens de `docs/ESPECIFICACION.md` sección 6 y los mockups de `diseno/` mandan sobre cualquier gusto por defecto.
- Estilos con las utilidades de los tokens (`bg-bottle`, `text-ink`, `rounded-tarjeta`, `duration-media`, `ease-salida`). Nunca valores arbitrarios de color (`bg-[#133B34]`) ni la paleta por defecto de Tailwind: `@theme` la desactiva con `--color-*: initial`. Las transparencias usan el modificador de opacidad sobre un token (`bg-ink/45`). Si falta un token, se agrega en `global.css` y en la sección 6 de la especificación.
- Se quedan en CSS (en `global.css`, fuera de `@theme`): la regla de `prefers-reduced-motion` y los estilos de View Transitions (`::view-transition-*`).
- Movimiento: escenas 3D decorativas en varias vistas, también en celular; lo demás responde a acciones del cliente, salvo la rotación de los carruseles. Respeta `prefers-reduced-motion` en cada animación: sin three.js y con los carruseles en pausa.

## Reglas que no se negocian

- **Accesibilidad WCAG 2.2 AA:** elementos nativos (`button`, `a`, `input` con `label`), contraste ≥ 4,5:1, objetivos táctiles ≥ 44 px, foco visible, `aria-live` en conteos y pedido, diálogos con `aria-modal`, cierre con Esc y retorno de foco. Respetar `prefers-reduced-motion`. Los carruseles solo rotan solos con botón de pausa, se detienen con el puntero o el foco encima (WCAG 2.2.2) y arrancan en pausa con movimiento reducido.
- **SEO:** un solo `h1` por página; `title` y `meta description` por página; cada producto tiene su propia página estática `/producto/[slug]`; datos estructurados JSON-LD (`Pharmacy` en el inicio, `Product`/`Offer` en productos de venta libre, `BreadcrumbList` en catálogo y producto); `sitemap.xml` y URL canónica. El carrito lleva `noindex`.
- **Contenido sanitario:** nunca redactar indicaciones, dosis ni advertencias; se muestran tal como vienen de la hoja (copiadas del empaque o inserto aprobado por el Invima). Los medicamentos con `condicion_venta = formula` no muestran precio ni se agregan al carrito: solo «Enviar fórmula por WhatsApp». Mostrar «Si los síntomas persisten, consulte a su médico» en medicamentos de venta libre.
- **Datos personales (Ley 1581):** el formulario del pedido pide solo nombre, dirección y forma de pago, con casilla de autorización y enlace a la política. No se guarda nada en servidor.
- **Copys en español de Colombia**, en segunda persona («tú»), frases cortas, sin mayúsculas sostenidas ni signos decorativos.
- Formato de precios: `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.

## Convenciones

- Componentes en `src/components/` con nombre en español y PascalCase (`TarjetaProducto.tsx`, `FichaProducto.tsx`).
- Un único módulo de dominio en `src/lib/` para productos, carrito y mensaje de WhatsApp, con pruebas unitarias.
- No agregar dependencias sin justificarlo en el plan de la fase.
