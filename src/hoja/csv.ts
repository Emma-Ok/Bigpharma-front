/**
 * Parser CSV (RFC 4180) para las pestañas publicadas de Google Sheets:
 * campos entre comillas con comas, saltos de línea y comillas dobles escapadas.
 */
export function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let enComillas = false;
  const t = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (enComillas) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }
    if (c === '"') {
      enComillas = true;
    } else if (c === ',') {
      fila.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else {
      campo += c;
    }
  }
  if (campo !== '' || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((v) => v.trim() !== ''));
}

/** Convierte el CSV en objetos usando la primera fila como encabezados. */
export function csvAObjetos(texto: string): Record<string, string>[] {
  const [encabezados, ...filas] = parsearCsv(texto);
  if (!encabezados) return [];
  const claves = encabezados.map((e) => e.trim());
  return filas.map((fila) =>
    Object.fromEntries(claves.map((clave, i) => [clave, (fila[i] ?? '').trim()])),
  );
}
