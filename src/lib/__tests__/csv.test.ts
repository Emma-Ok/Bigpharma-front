import { describe, expect, it } from 'vitest';
import { csvAObjetos, parsearCsv } from '../csv';

describe('parsearCsv', () => {
  it('respeta comas, saltos de línea y comillas escapadas dentro de comillas', () => {
    const texto = 'a,b,c\n1,"0,9 %","línea 1\nlínea 2"\n2,"dice ""hola""",\n';
    expect(parsearCsv(texto)).toEqual([
      ['a', 'b', 'c'],
      ['1', '0,9 %', 'línea 1\nlínea 2'],
      ['2', 'dice "hola"', ''],
    ]);
  });

  it('acepta CRLF, BOM y omite filas vacías', () => {
    expect(parsearCsv('﻿x,y\r\n1,2\r\n,\r\n')).toEqual([
      ['x', 'y'],
      ['1', '2'],
    ]);
  });

  it('convierte filas en objetos con los encabezados', () => {
    expect(csvAObjetos('id,nombre\n a1 , Suero oral ')).toEqual([{ id: 'a1', nombre: 'Suero oral' }]);
  });
});
