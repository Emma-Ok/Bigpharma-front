# Arquitectura del frontend

El código se organiza por funcionalidades. Las reglas de negocio son funciones puras en `src/dominio/`; `localStorage`, `fetch` y el DOM quedan en los bordes.

## Dónde está cada cosa

```
src/
├── pages/               Rutas: traen datos y componen
├── layouts/             Base, Legal, Encabezado, Pie
├── funcionalidades/
│   ├── portada/         PresentacionProfesional, Servicios, PreguntasFrecuentes
│   ├── anuncios/        BarraAvisos, CarruselAnuncios, AnuncioLateral, carrusel.ts
│   ├── catalogo/        Catalogo, CatalogoResumido, Buscador, CategoriasIconos
│   ├── producto/        TarjetaProducto, FichaProducto, DialogoFicha, IlustracionProducto,
│   │                    fichas.ts (carga y precarga), transiciones.ts (View Transitions)
│   └── pedido/          PaginaPedido, PanelPedido, BarraPedidoMovil, ControlCantidad,
│                        ProgresoDomicilio, VaciarPedido, acciones.ts, usarCarrito.ts,
│                        almacenCarrito.ts (localStorage)
├── compartido/
│   ├── ui/              Icono, iconos.ts, RutaNavegacion, estilosCategoria.ts
│   ├── catalogoCliente.ts   cargarCatalogo, usarCatalogo
│   └── movimiento/      preferencias.ts, animaciones.ts, 3d/ (escenas y EscenaCapsulas)
├── dominio/             TypeScript puro: producto, categorias, busqueda, carrito, domicilio,
│                        pedido, whatsapp, sitio, seo, formato
├── hoja/                Solo build: cargarDatos, leerTabla, csv, esquemas, validacion
├── styles/
└── assets/
```

## Antes y ahora

| Antes | Ahora |
|---|---|
| `src/components/*` | Su funcionalidad, `src/compartido/ui/` o `src/layouts/` |
| `src/components/movimiento.ts` | `compartido/movimiento/animaciones.ts` y `preferencias.ts` |
| `src/scripts/3d/*` | `compartido/movimiento/3d/` |
| `src/lib/catalogo.ts` | `dominio/categorias.ts`, `producto.ts` y `busqueda.ts` |
| `src/lib/carrito.ts` | `dominio/carrito.ts`, `dominio/domicilio.ts` y `funcionalidades/pedido/almacenCarrito.ts` |
| `FORMAS_DE_PAGO`, `DatosCliente` | `dominio/pedido.ts` |
| `Configuracion`, `Anuncio` | `dominio/sitio.ts` |
| `src/lib/datos.ts` | `hoja/` (`cargarDatos` está en `hoja/cargarDatos.ts`) |
| `formaDe` | `dominio/producto.ts` |
| `textoDomicilio` | `dominio/domicilio.ts` |

## Reglas de dependencia

```
pages, layouts → funcionalidades → compartido → dominio
pages → hoja → dominio
Entre funcionalidades: catalogo → producto → pedido
```

- `dominio/` no importa Preact, Astro, Node ni el DOM.
- Nada que llegue al navegador importa de `hoja/`, ni siquiera tipos.
- `compartido/` no importa de `funcionalidades/`.
- `pedido` no importa de `producto` ni de `catalogo`; `producto` no importa de `catalogo`.
- `portada` y `anuncios` no importan de otras funcionalidades.

Todavía no hay una regla de ESLint que lo valide: se cumple a mano.

## Convenciones

- Imports: `./` dentro de la misma carpeta y `@/` para todo lo demás.
- Sin `index.ts` por carpeta: pueden arrastrar código de más a las islas.
- Las pruebas van en `__tests__/` junto al código que prueban.
- La consulta de movimiento reducido en TypeScript es `prefiereMenosMovimiento()`, de `compartido/movimiento/preferencias.ts`.

## Contratos por el DOM

Estas piezas se comunican por atributos, no por imports. Si cambias el marcado, conserva estos nombres:

| Contrato | Quién lo pone | Quién lo usa |
|---|---|---|
| `#anuncios-pedido` | `Base.astro` | `pedido/acciones.ts` |
| `[data-contador-pedido]` | `Encabezado.astro`, `BarraPedidoMovil.tsx` | `animaciones.ts` |
| `[data-abrir-buscador]` | `Encabezado.astro`, `CatalogoResumido.tsx` | `Buscador.tsx` |
| `[data-escena]` | `EscenaCapsulas.astro`, `Servicios.astro` | `3d/cargador.ts` |
| `[data-vt]`, `[data-vt-tarjeta]` | `producto/transiciones.ts`, `Catalogo.tsx`, `CatalogoResumido.tsx` | `global.css` |

## Pendiente para el rediseño

La refactorización solo movió código. Lo siguiente queda para cuando se rehagan `Catalogo`, `PaginaPedido`, `TarjetaProducto` y el panel del pedido:

| Pieza | Ubicación | Qué resuelve |
|---|---|---|
| `usarFiltrosCatalogo.ts` | `funcionalidades/catalogo/` | Estado de filtros y URL, hoy en `Catalogo.tsx` |
| `filtrosCatalogo.ts` | `dominio/` | `leerUrl` y `escribirUrl` como funciones puras con pruebas |
| `PanelFiltros.tsx`, `Paginacion.tsx`, `SinResultados.tsx` | `funcionalidades/catalogo/` | Partes de `Catalogo.tsx` |
| `AccionProducto.tsx` | `funcionalidades/producto/` | Fórmula, agotado o agregar, repetido en tarjeta y ficha |
| `usarVistaRapida.ts` | `funcionalidades/producto/` | Vista rápida, repetida en `Catalogo` y `CatalogoResumido` |
| `ResumenPedido.tsx`, `FormularioPedido.tsx` | `funcionalidades/pedido/` | Partes de `PaginaPedido.tsx` |
| `validarDatosEntrega` | `dominio/pedido.ts` | Validación, hoy dentro de `PaginaPedido.tsx` |
| Prop `tienda` | Páginas e islas | `{ whatsapp, entrega, umbral }` en una sola prop, con el texto de entrega armado en un solo lugar (hoy en 3 páginas) |

## Pendiente al final

Después del rediseño:

- Validar las reglas de dependencia con `no-restricted-imports` en ESLint.
- Actualizar las rutas de `docs/ESPECIFICACION.md` (`estilosCategoria.ts`) y `docs/MOVIMIENTO-Y-3D.md` (`src/scripts/3d/`).
