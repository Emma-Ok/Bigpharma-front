import { useCallback, useState } from 'preact/hooks';
import { categoria as datosCategoria, filtrar, type CategoriaId, type ProductoResumen } from '../lib/catalogo';
import CategoriasIconos from './CategoriasIconos';
import DialogoFicha, { precargarFicha } from './DialogoFicha';
import Icono from './Icono';
import PanelPedido from './PanelPedido';
import TarjetaProducto from './TarjetaProducto';
import { cambiarConTransicion } from './movimiento';

interface Props {
  productos: ProductoResumen[];
  whatsapp: string;
  entrega: string;
  umbral: number;
}

/** Visibilidad por posición para mostrar exactamente 2 filas con 2, 3, 4 o 5 columnas. */
function claseFila(i: number): string {
  if (i >= 8) return 'hidden lg:flex';
  if (i >= 6) return 'hidden md:flex';
  if (i >= 4) return 'hidden sm:flex';
  return 'flex';
}

/** Catálogo resumido de la portada: buscador, categorías, 2 filas de productos y panel del pedido. */
export default function CatalogoResumido({ productos, whatsapp, entrega, umbral }: Props) {
  const [cat, setCat] = useState<CategoriaId>();
  const [vista, setVista] = useState<{ producto: ProductoResumen; origen: HTMLElement } | null>(null);
  const [mostrando, setMostrando] = useState<string | null>(null);
  const enCategoria = filtrar(productos, { categoria: cat });
  const nombreCat = cat ? datosCategoria(cat).nombre : '';
  const cerrarVista = useCallback(() => {
    setVista(null);
    setMostrando(null);
  }, []);

  return (
    <>
      <button
        type="button"
        data-abrir-buscador
        aria-haspopup="dialog"
        class="mb-4.5 flex h-14.5 w-full cursor-text items-center gap-3 rounded-[14px] border-2 border-texto-2 bg-blanco px-4.5 text-left text-[16.5px] text-texto-2"
      >
        <Icono nombre="lupa" tamano={22} grosor={2.2} class="text-azul" />
        Busca por nombre o síntoma
      </button>

      <CategoriasIconos seleccion={cat} onElegir={(c) => cambiarConTransicion(() => setCat(c))} />

      <div class="mt-2.5 flex flex-wrap items-start gap-8">
        <div class="flex min-w-0 flex-[999_1_560px] flex-col gap-4.5">
          <p aria-live="polite" class="m-0 text-[15px] text-texto-2">
            {cat ? `${enCategoria.length} productos en ${nombreCat}` : 'Lo más pedido y en promoción'}
          </p>
          <ul class="m-0 grid list-none grid-cols-2 gap-3.5 p-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {enCategoria.slice(0, 10).map((p, i) => (
              <li key={p.id} class={`min-w-0 ${claseFila(i)}`} data-vt-tarjeta style={`--vt-tarjeta: tarjeta-${p.id}`}>
                <TarjetaProducto
                  producto={p}
                  whatsapp={whatsapp}
                  onVer={(producto, origen) => setVista({ producto, origen })}
                  sinTransicion={mostrando === p.id}
                  elegida={vista?.producto.id === p.id}
                  onPrecargar={(producto) => precargarFicha(producto.slug)}
                />
              </li>
            ))}
          </ul>
          <a
            href={cat ? `/catalogo?categoria=${cat}` : '/catalogo'}
            class="inline-flex min-h-12.5 items-center gap-2.5 self-center rounded-boton border-2 border-azul bg-blanco px-6 font-semibold text-azul no-underline"
          >
            {cat ? `Ver más en ${nombreCat} (${enCategoria.length})` : `Ver más productos (${productos.length})`}
            <Icono nombre="flecha" tamano={18} grosor={2.2} />
          </a>
        </div>
        <div class="hidden min-w-0 flex-[1_1_280px] self-stretch lg:block">
          <PanelPedido umbral={umbral} productos={productos} />
        </div>
      </div>

      <DialogoFicha abierto={vista} whatsapp={whatsapp} entrega={entrega} onCerrar={cerrarVista} onMostrar={setMostrando} />
    </>
  );
}
