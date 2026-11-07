const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** $7.000: formato es-CO sin el espacio que Intl pone entre el signo y el número. */
export function formatearPrecio(valor: number): string {
  return pesos
    .formatToParts(valor)
    .filter((parte) => parte.type !== 'literal')
    .map((parte) => parte.value)
    .join('');
}

/** Minúsculas y sin tildes, para buscar y comparar. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** «Diclofenaco gel 1 %» → «diclofenaco-gel-1». */
export function aSlug(texto: string): string {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Texto de la hoja que todavía está por llenar: «[Laboratorio]». */
export function esMarcador(texto: string | undefined): boolean {
  return !!texto && /^\[.*\]$/.test(texto.trim());
}

/** ¿Queda algún [texto por llenar], aunque sea en parte del campo («INVIMA [número]»)? */
export function tieneMarcador(texto: string | undefined): boolean {
  return !!texto && /\[[^\]]*\]/.test(texto);
}

export function esUrl(texto: string | undefined): boolean {
  return !!texto && /^https?:\/\/\S+$/.test(texto.trim());
}
