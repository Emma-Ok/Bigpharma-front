import type { APIRoute, GetStaticPaths } from 'astro';
import { cargarDatos } from '@/hoja/cargarDatos';
import type { Producto } from '@/dominio/producto';

export const getStaticPaths = (async () => {
  const { productos } = await cargarDatos();
  return productos.map((producto) => ({ params: { slug: producto.slug }, props: { producto } }));
}) satisfies GetStaticPaths;

/** Ficha completa para la vista rápida del catálogo. */
export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify((props as { producto: Producto }).producto), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
