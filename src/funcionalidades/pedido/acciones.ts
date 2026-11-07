import { agregar, cantidadDe, fijarCantidad, vaciar } from '@/dominio/carrito';
import { carritoNavegador } from '@/funcionalidades/pedido/almacenCarrito';
import { animarAgregado } from '@/compartido/movimiento/animaciones';

/** Mensaje para lectores de pantalla en la región aria-live del layout. */
export function anunciar(texto: string) {
  const region = document.getElementById('anuncios-pedido');
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = texto;
  });
}

export function agregarAlPedido(producto: { id: string; nombre: string }, origen?: HTMLElement | null) {
  carritoNavegador().actualizar((c) => agregar(c, producto.id));
  anunciar(`Agregaste ${producto.nombre} al pedido.`);
  if (origen) animarAgregado(origen);
}

export function cambiarCantidad(producto: { id: string; nombre: string }, cantidad: number) {
  const almacen = carritoNavegador();
  const antes = cantidadDe(almacen.leer(), producto.id);
  const despues = cantidadDe(almacen.actualizar((c) => fijarCantidad(c, producto.id, cantidad)), producto.id);
  if (despues === antes) return;
  anunciar(
    despues === 0
      ? `Quitaste ${producto.nombre} del pedido.`
      : `${producto.nombre}: ${despues} ${despues === 1 ? 'unidad' : 'unidades'} en el pedido.`,
  );
}

export function vaciarPedido() {
  carritoNavegador().actualizar(vaciar);
  anunciar('Vaciaste tu pedido.');
}
