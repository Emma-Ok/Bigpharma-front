import { useState } from 'preact/hooks';
import { filtrar } from '@/dominio/busqueda';
import { categoria as datosCategoria, type CategoriaId } from '@/dominio/categorias';
import type { ProductoResumen } from '@/dominio/producto';
import type { Tienda } from '@/dominio/sitio';
import { cambiarConTransicion } from '@/compartido/movimiento/animaciones';
import Boton from '@/compartido/ui/Boton';
import Icono from '@/compartido/ui/Icono';
import DialogoFicha from '@/funcionalidades/producto/DialogoFicha';
import TarjetaProducto from '@/funcionalidades/producto/TarjetaProducto';
import { usarVistaRapida } from '@/funcionalidades/producto/usarVistaRapida';
import CategoriasIconos from './CategoriasIconos';
import ConPanelPedido, { GRILLA } from './ConPanelPedido';

interface Props {
  productos: ProductoResumen[];
  tienda: Tienda;
}

/** Catálogo resumido de la portada: 2 filas de productos (4 en 2 columnas, 6 en 3). */
export default function CatalogoResumido({ productos, tienda }: Props) {
  const [cat, setCat] = useState<CategoriaId>();
  const rapida = usarVistaRapida();
  const enCategoria = filtrar(productos, { categoria: cat });
  const nombreCat = cat ? datosCategoria(cat).nombre : '';

  return (
    <div class="flex flex-col gap-4">
      {/* Debajo de 1200 px la fila se disuelve (contents): así la búsqueda es sticky en todo el catálogo. */}
      <div class="contents lg:flex lg:items-center lg:justify-between lg:gap-8">
        <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="cat-titulo" class="m-0 text-[clamp(26px,2.6vw,34px)] leading-tight font-semibold text-bottle">
            Catálogo
          </h2>
          <a href="/catalogo" class="inline-flex min-h-11 items-center text-[15.5px] font-semibold text-bottle">
            Ver todos los productos
          </a>
        </div>
        <div class="sticky top-0 z-20 -mx-margen bg-paper px-margen py-2 lg:static lg:m-0 lg:w-120 lg:p-0">
          <button
            type="button"
            data-abrir-buscador
            aria-haspopup="dialog"
            class="flex h-13 w-full cursor-text items-center gap-3 rounded-[14px] border-2 border-muted bg-blanco px-4 text-left text-base text-muted"
          >
            <Icono nombre="lupa" tamano={22} grosor={2.2} class="text-bottle" />
            Busca por nombre o síntoma
          </button>
        </div>
      </div>

      <CategoriasIconos seleccion={cat} onElegir={(c) => cambiarConTransicion(() => setCat(c))} />

      <ConPanelPedido umbral={tienda.umbral} productos={productos}>
        <p aria-live="polite" class="m-0 text-[15px] text-muted">
          {cat ? `${enCategoria.length} productos en ${nombreCat}` : 'Lo más pedido y en promoción'}
        </p>
        <ul class={GRILLA}>
          {enCategoria.slice(0, 6).map((p, i) => (
            <li key={p.id} class={`min-w-0 ${i >= 4 ? 'hidden sm:flex' : 'flex'}`} data-vt-tarjeta style={`--vt-tarjeta: tarjeta-${p.id}`}>
              <TarjetaProducto producto={p} whatsapp={tienda.whatsapp} {...rapida.tarjeta(p)} />
            </li>
          ))}
        </ul>
        <Boton variante="secundario" class="self-center" href={cat ? `/catalogo?categoria=${cat}` : '/catalogo'}>
          {cat ? `Ver más en ${nombreCat} (${enCategoria.length})` : `Ver más productos (${productos.length})`}
          <Icono nombre="flecha" tamano={18} grosor={2.2} />
        </Boton>
      </ConPanelPedido>

      <DialogoFicha {...rapida.dialogo} tienda={tienda} />
    </div>
  );
}
