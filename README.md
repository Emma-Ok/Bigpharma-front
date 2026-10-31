# Bigpharma-front

Frontend to bigpharma, a local pharmacy: sitio de una droguería de barrio que vende a domicilio y ofrece inyectología en casa. El pedido se arma en la web y se envía por WhatsApp.

Astro 7 (estático) + Preact + Tailwind CSS 4 + three.js, desplegado en Cloudflare Workers. Los datos salen de Google Sheets publicado como CSV, leído en el build.

## Desarrollo

Todo corre en Docker (Node 24); no hace falta Node en el equipo.

```sh
docker compose run --rm web npm install    # la primera vez
docker compose up -d                        # http://localhost:4321
docker compose exec web npm run check       # astro check + ESLint + tokens
docker compose exec web npm run build
docker compose exec web npm run test        # Vitest
docker compose --profile pruebas run --rm pruebas   # Playwright + axe
```

## Documentación

- `CLAUDE.md`: reglas del proyecto y comandos.
- `docs/ESPECIFICACION.md`: qué construir (flujo, datos, páginas, diseño).
- `docs/MOVIMIENTO-Y-3D.md`: movimiento y escenas 3D.
- `docs/OPERACION.md`: cómo editar la hoja, publicar y desplegar.
- `docs/PROGRESO.md`: bitácora, decisiones y estado.
- `diseno/`: mockups de referencia.
