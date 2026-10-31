import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { csvAObjetos } from '../csv';
import { validarAnuncios, validarConfiguracion, validarProductos } from '../datos';

const leer = (archivo: string) => csvAObjetos(readFileSync(`datos/${archivo}`, 'utf8'));

const filaBase = {
  id: 'x1',
  nombre: 'Producto',
  categoria: 'dolor',
  tipo: 'med',
  condicion_venta: 'libre',
  laboratorio_marca: 'Lab',
  presentacion: 'Caja × 10 tabletas',
  unidades: '10',
  unidad: 'tableta',
  precio: '3500',
  registro_sanitario: 'INVIMA 1',
  disponibilidad: 'disponible',
  para_que_sirve: 'a',
  como_se_usa: 'b',
  advertencias: 'c',
};

describe('validarProductos con datos/productos.csv', () => {
  const { datos, errores } = validarProductos(leer('productos.csv'));

  it('valida los 24 productos de ejemplo sin errores', () => {
    expect(errores).toEqual([]);
    expect(datos).toHaveLength(24);
  });

  it('convierte los números exportados por Sheets («3500.0»)', () => {
    const a1 = datos.find((p) => p.id === 'a1');
    expect(a1).toMatchObject({ condicionVenta: 'libre', precio: 3500, unidades: 10, precioPorUnidad: 350 });
  });

  it('los medicamentos con fórmula no tienen precio', () => {
    const formula = datos.filter((p) => p.condicionVenta === 'formula');
    expect(formula.map((p) => p.id)).toEqual(['g1', 'g2', 'g3']);
    for (const p of formula) expect(p).not.toHaveProperty('precio');
  });

  it('recalcula el descuento', () => {
    const d1 = datos.find((p) => p.id === 'd1');
    expect(d1).toMatchObject({ precioAntes: 49400, descuentoPct: 15 });
  });

  it('crea slugs y descarta fotos que no son enlaces', () => {
    const a4 = datos.find((p) => p.id === 'a4')!;
    expect(a4.slug).toBe('diclofenaco-gel-1');
    expect(a4.fotos).toEqual([]);
  });
});

describe('validarProductos con errores', () => {
  it('explica qué falta y en qué fila', () => {
    const { errores } = validarProductos([{ ...filaBase, precio: '' }, { ...filaBase, id: 'x2', nombre: '' }]);
    expect(errores).toEqual([
      'Productos, fila 2 (id x1): falta «precio» (obligatorio en venta libre)',
      'Productos, fila 3 (id x2): falta «nombre»',
    ]);
  });

  it('rechaza ids repetidos, categorías inválidas y precios con puntos', () => {
    const { errores } = validarProductos([
      filaBase,
      filaBase,
      { ...filaBase, id: 'x3', categoria: 'dolr' },
      { ...filaBase, id: 'x4', precio: '3.500' },
    ]);
    expect(errores[0]).toContain('el id «x1» está repetido');
    expect(errores[1]).toContain('«dolr» no es un valor válido para «categoria»');
    expect(errores[2]).toContain('«3.500» en «precio» debe ser un número entero en pesos');
  });

  it('ignora el precio de un medicamento con fórmula aunque venga en la hoja', () => {
    const { datos } = validarProductos([{ ...filaBase, condicion_venta: 'formula', precio: '9000' }]);
    expect(datos[0]).not.toHaveProperty('precio');
  });

  it('agrega el id al slug cuando dos nombres chocan', () => {
    const { datos } = validarProductos([filaBase, { ...filaBase, id: 'x2' }]);
    expect(datos.map((p) => p.slug)).toEqual(['producto-x1', 'producto-x2']);
  });

  it('ignora precio_antes menor o igual al precio, con aviso', () => {
    const { datos, avisos } = validarProductos([{ ...filaBase, precio_antes: '3000' }]);
    expect(datos[0]).not.toHaveProperty('descuentoPct', expect.anything());
    expect(avisos[0]).toContain('precio_antes');
  });
});

describe('validarConfiguracion y validarAnuncios', () => {
  it('lee la configuración de ejemplo', () => {
    const { datos, errores } = validarConfiguracion(leer('configuracion.csv'));
    expect(errores).toEqual([]);
    expect(datos?.domicilioGratisDesde).toBe(60000);
    expect(datos?.avisos).toHaveLength(3);
  });

  it('falla si falta un valor obligatorio', () => {
    const filas = leer('configuracion.csv').filter((f) => f.clave !== 'domicilio_gratis_desde');
    expect(validarConfiguracion(filas).errores).toEqual(['Configuracion: falta «domicilio_gratis_desde»']);
  });

  it('solo toma los anuncios activos', () => {
    const filas = leer('anuncios.csv');
    filas[0].activo = 'no';
    const { datos, errores } = validarAnuncios(filas);
    expect(errores).toEqual([]);
    expect(datos.map((a) => a.id)).toEqual(['b2', 'b3', 'lat']);
  });
});
