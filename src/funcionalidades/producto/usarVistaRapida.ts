import { useCallback, useState } from 'preact/hooks';
import type { ProductoResumen } from '@/dominio/producto';
import { precargarFicha } from './fichas';

/** Estado de la vista rápida: props para cada TarjetaProducto y para el DialogoFicha de la lista. */
export function usarVistaRapida() {
  const [vista, setVista] = useState<{ producto: ProductoResumen; origen: HTMLElement } | null>(null);
  const [mostrando, setMostrando] = useState<string | null>(null);
  const onCerrar = useCallback(() => {
    setVista(null);
    setMostrando(null);
  }, []);
  return {
    dialogo: { abierto: vista, onCerrar, onMostrar: setMostrando },
    tarjeta: (p: ProductoResumen) => ({
      onVer: (producto: ProductoResumen, origen: HTMLElement) => setVista({ producto, origen }),
      sinTransicion: mostrando === p.id,
      elegida: vista?.producto.id === p.id,
      onPrecargar: (producto: ProductoResumen) => precargarFicha(producto.slug),
    }),
  };
}
