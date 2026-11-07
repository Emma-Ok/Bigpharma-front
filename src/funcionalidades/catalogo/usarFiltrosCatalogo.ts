import { useEffect, useRef, useState } from 'preact/hooks';
import { cambiarConTransicion } from '@/compartido/movimiento/animaciones';
import { recordarCatalogo } from '@/compartido/navegacion/volver';
import { escribirFiltros, FILTROS_INICIALES, leerFiltros, type FiltrosCatalogo } from '@/dominio/filtrosCatalogo';

/** Filtros del catálogo sincronizados con la URL. */
export function usarFiltrosCatalogo() {
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(FILTROS_INICIALES);
  const listo = useRef(false);

  useEffect(() => {
    setFiltros(leerFiltros(window.location.search));
    listo.current = true;
  }, []);

  useEffect(() => {
    if (!listo.current) return;
    const consulta = escribirFiltros(filtros);
    // Conserva history.state para no confundir al router de Astro.
    history.replaceState(history.state, '', `${window.location.pathname}${consulta ? `?${consulta}` : ''}`);
    // El enlace «volver» de la ficha y del pedido regresa a este mismo estado.
    recordarCatalogo(consulta);
  }, [filtros]);

  /** Cualquier cambio de filtro vuelve a la primera página. */
  const cambiar = (parcial: Partial<FiltrosCatalogo>, conTransicion = false) => {
    const aplicar = () => setFiltros((f) => ({ ...f, pagina: 1, ...parcial }));
    if (conTransicion) cambiarConTransicion(aplicar);
    else aplicar();
  };

  return {
    filtros,
    cambiar,
    borrar: (conTransicion = true) => cambiar({ ...FILTROS_INICIALES, orden: filtros.orden }, conTransicion),
    irAPagina: (pagina: number) => setFiltros((f) => ({ ...f, pagina })),
  };
}
