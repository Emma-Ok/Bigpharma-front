import type { APIRoute } from 'astro';
import { cargarDatos } from '../lib/datos';
import { resumir } from '../lib/catalogo';

/** Catálogo resumido para el buscador y el carrito en el navegador. */
export const GET: APIRoute = async () => {
  const { productos } = await cargarDatos();
  return new Response(JSON.stringify(productos.map(resumir)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
