# Droguería a domicilio: reglas del proyecto

Sitio web de una droguería de barrio que vende a domicilio y ofrece inyectología en casa. El pedido se arma en la web y se envía por WhatsApp; no hay pasarela de pago ni cuentas de usuario.

Lee `docs/ESPECIFICACION.md` antes de cualquier tarea. Los mockups de referencia están en `diseno/` (ver «Cómo leer los mockups» en la especificación).

## Stack

- Astro (salida estática) + TypeScript. Islas interactivas con Preact solo donde hace falta (buscador, carrito, carrusel, filtros, ficha).
- Estilos: Tailwind CSS v4 con el plugin oficial de Vite (`@tailwindcss/vite`), sin `tailwind.config.js`. Los tokens van en `@theme` dentro de `src/styles/global.css`. Sin librerías de componentes de UI.
- Datos: Google Sheets publicado como CSV, leído **en build** (`src/hoja/`). Copia local de respaldo en `datos/productos.csv` para desarrollo sin red.
- Carrito: estado en el navegador (`localStorage`, con try/catch) compartido entre páginas.
- Movimiento: View Transitions de Astro (`<ClientRouter />`), CSS y Web Animations API. `three` para tres escenas decorativas, cada una cargada solo cuando se va a usar: hero y jeringa de servicios (islas con `client:visible`, tras la primera interacción) y celebración del domicilio gratis (se prepara en reposo tras la primera interacción y no corre si el equipo no llega a 40 fps). Sin GPU no se carga. Ninguna animación puede bloquear la interfaz ni retrasar la apertura de WhatsApp. Detalle en `docs/MOVIMIENTO-Y-3D.md`.
- Despliegue: Cloudflare Pages. Un deploy hook reconstruye el sitio cuando cambia la hoja.

## Entorno

Todo se ejecuta **dentro del contenedor** `web` de Docker Compose (proyecto `bigpharma`, Node 24 LTS). No instales Node ni paquetes en WSL ni corras `npm` o `npx` fuera del contenedor.

- Levantar (servidor en http://localhost:4321 con recarga automática): `docker compose up -d`
- Ver el registro del servidor: `docker compose logs -f web`
- Detener: `docker compose down` (`node_modules` está en la carpeta del proyecto, ignorado por git, para que el editor vea los tipos; `docker compose down -v` borra la caché de npm)
- Instalar dependencias después de cambiar `package.json`: `docker compose run --rm web npm install`
- Agregar una dependencia: `docker compose run --rm web npm install <paquete>`
- Correr un script con el contenedor arriba: `docker compose exec web npm run build` (igual con `check` y `test`)
- Correr un script sin levantar el servidor: `docker compose run --rm web npm run test`
- Reconstruir la imagen después de cambiar el `Dockerfile`: `docker compose build`
- Pruebas de navegador (fase de pruebas, imagen oficial de Playwright): `docker compose --profile pruebas run --rm pruebas`

## Comandos

Se corren dentro del contenedor (ver «Entorno»).

- `npm run dev`: desarrollo
- `npm run build`: build estático. Avisa de los campos `[entre corchetes]` y de los avisos de datos; con `VALIDAR_HOJA=estricto` falla y los lista. **Cuando la hoja esté llena, hay que activar `VALIDAR_HOJA=estricto` en Workers Builds.**
- `npm run check`: `astro check` + ESLint (con reglas de accesibilidad) + `scripts/revisar-tokens.mjs` (falla con colores arbitrarios)
- `npm run test`: Vitest (lógica de `src/dominio/` y `src/hoja/`)
- `npm run test:e2e`: Playwright + axe contra el build de producción; corre en el servicio `pruebas` (`docker compose --profile pruebas run --rm pruebas`)

## Diseño

- Para cualquier decisión visual (composición, tipografía, color, movimiento, nuevos componentes) carga y sigue la skill `frontend-design` en `.claude/skills/frontend-design` (es local: `.claude/` no se sube a GitHub). Los tokens de `docs/ESPECIFICACION.md` sección 6 y los mockups de `diseno/` mandan sobre cualquier gusto por defecto.
- Estilos con las utilidades de los tokens (`bg-bottle`, `text-ink`, `rounded-tarjeta`, `duration-media`, `ease-salida`). Nunca valores arbitrarios de color (`bg-[#133B34]`) ni la paleta por defecto de Tailwind: `@theme` la desactiva con `--color-*: initial`. Las transparencias usan el modificador de opacidad sobre un token (`bg-ink/45`). Si falta un token, se agrega en `global.css` y en la sección 6 de la especificación.
- Se quedan en CSS (en `global.css`, fuera de `@theme`): la regla de `prefers-reduced-motion` y los estilos de View Transitions (`::view-transition-*`).
- Movimiento: escenas 3D en el hero, en servicios y en la celebración, también en celular; lo demás responde a acciones del cliente, salvo la rotación de los carruseles. Respeta `prefers-reduced-motion` en cada animación: sin three.js y con los carruseles en pausa.

## Reglas que no se negocian

- **Accesibilidad WCAG 2.2 AA:** elementos nativos (`button`, `a`, `input` con `label`), contraste ≥ 4,5:1, objetivos táctiles ≥ 44 px, foco visible, `aria-live` en conteos y pedido, diálogos con `aria-modal`, cierre con Esc y retorno de foco. Respetar `prefers-reduced-motion`. Los carruseles que rotan solos se detienen con el puntero o el foco encima y con la pestaña oculta. Por decisión de diseño no tienen botón de pausa: la barra de avisos no lleva controles y el carrusel de anuncios usa chips de posición, gesto y flechas del teclado. Con movimiento reducido, la barra deja fijo el primer mensaje y el carrusel de anuncios no rota.
- **SEO:** un solo `h1` por página; `title` y `meta description` por página; cada producto tiene su propia página estática `/producto/[slug]`; datos estructurados JSON-LD (`Pharmacy` en el inicio, `Product`/`Offer` en productos de venta libre, `BreadcrumbList` en catálogo y producto); `sitemap.xml` y URL canónica. El carrito lleva `noindex`.
- **Contenido sanitario:** nunca redactar indicaciones, dosis ni advertencias; se muestran tal como vienen de la hoja (copiadas del empaque o inserto aprobado por el Invima). Los medicamentos con `condicion_venta = formula` no muestran precio ni se agregan al carrito: solo «Enviar fórmula por WhatsApp» en la ficha y «Enviar mi fórmula» en la tarjeta. Mostrar «Si los síntomas persisten, consulte a su médico» en medicamentos de venta libre.
- **Datos personales (Ley 1581):** el formulario del pedido pide solo nombre, dirección y forma de pago, con casilla de autorización y enlace a la política. No se guarda nada en servidor.
- **Copys en español de Colombia**, en segunda persona («tú»), frases cortas, sin mayúsculas sostenidas ni signos decorativos.
- Formato de precios: `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.

## Convenciones

- Componentes en `src/funcionalidades/<funcionalidad>/`, o en `src/compartido/ui/` si no tienen negocio, con nombre en español y PascalCase (`TarjetaProducto.tsx`, `FichaProducto.tsx`). La estructura y las reglas de dependencia están en `docs/ARQUITECTURA.md`.
- Un único módulo de dominio en `src/dominio/` para productos, carrito y mensaje de WhatsApp, con pruebas unitarias. Es TypeScript puro: sin Preact, DOM ni Node.
- No agregar dependencias sin justificarlo en el plan de la fase.
