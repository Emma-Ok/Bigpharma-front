# Arquitectura del frontend

El código se organiza por funcionalidades. Las reglas de negocio son funciones puras en `src/dominio/`; `localStorage`, `fetch` y el DOM quedan en los bordes.

## Dónde está cada cosa

```
src/
├── pages/               Rutas: traen datos y componen
├── layouts/             Base, Legal, Encabezado, Pie
├── funcionalidades/
│   ├── portada/         Hero, PresentacionProfesional, Servicios, PreguntasFrecuentes
│   ├── anuncios/        BarraAvisos, CarruselAnuncios, AnuncioLateral, carrusel.ts
│   ├── catalogo/        Catalogo, CatalogoResumido, ConPanelPedido, Buscador, CategoriasIconos,
│   │                    PanelFiltros, Paginacion, SinResultados, usarFiltrosCatalogo.ts
│   ├── producto/        TarjetaProducto, FichaProducto, AccionProducto, DialogoFicha,
│   │                    IlustracionProducto, usarVistaRapida.ts, fichas.ts (carga y precarga),
│   │                    transiciones.ts (View Transitions)
│   └── pedido/          PaginaPedido, ResumenPedido, FormularioPedido, PanelPedido, VistaPedido,
│                        BarraPedidoMovil, ControlCantidad, ProgresoDomicilio, VaciarPedido,
│                        acciones.ts, usarCarrito.ts, almacenCarrito.ts (localStorage)
├── compartido/
│   ├── ui/              Boton, HojaInferior, Icono, iconos.ts, RutaNavegacion, estilosCategoria.ts
│   ├── catalogoCliente.ts   cargarCatalogo, usarCatalogo
│   └── movimiento/      preferencias.ts, animaciones.ts, 3d/ (escenas e isla Escena3d)
├── dominio/             TypeScript puro: producto, categorias, busqueda, filtrosCatalogo, carrito,
│                        domicilio, pedido, whatsapp, sitio, seo, formato
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

## Prop `tienda`

Las islas reciben `{ whatsapp, entrega, umbral }` en una sola prop, armada con `tiendaDe(configuracion)` de `dominio/sitio.ts`. El texto de entrega solo se arma ahí.

## Contratos por el DOM

Estas piezas se comunican por atributos, no por imports. Si cambias el marcado, conserva estos nombres:

| Contrato | Quién lo pone | Quién lo usa |
|---|---|---|
| `#anuncios-pedido` | `Base.astro` | `pedido/acciones.ts` |
| `[data-contador-pedido]` | `Encabezado.astro`, `BarraPedidoMovil.tsx` | `animaciones.ts` |
| `--alto-barra-pedido` | `BarraPedidoMovil.tsx` | `global.css` (reserva el espacio al final de la página) |
| `[data-abrir-buscador]` | `Encabezado.astro`, `CatalogoResumido.tsx` | `Buscador.tsx` |
| `[data-escenario]`, `.imagen-estatica` | `Hero.astro`, `PresentacionProfesional.astro`, `Servicios.astro` | `global.css` (oculta la imagen cuando la escena está lista), `3d/hero.ts` |
| `[data-tarjeta-hero]`, `[data-foto-hero]` | `PresentacionProfesional.astro` | `3d/hero.ts` (plano oclusor y ancla de las piezas) |
| `[data-escena]`, `[data-escena-lista]` | `3d/Escena3d.tsx`, `3d/motor.ts` | `global.css`, pruebas |
| `[data-vt]`, `[data-vt-tarjeta]` | `producto/transiciones.ts`, `Catalogo.tsx`, `CatalogoResumido.tsx` | `global.css` |

## Pendiente al final

- Validar las reglas de dependencia con `no-restricted-imports` en ESLint.
