import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { csvAObjetos } from '../csv';
import { AVISO_MAX, camposPorLlenar, FRASE_MAX, validarAnuncios, validarConfiguracion, validarProductos } from '../validacion';

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

describe('camposPorLlenar', () => {
  const config = (valores: Record<string, string>) => Object.entries(valores).map(([clave, valor]) => ({ clave, valor }));
  const completa = { barrio: 'Chapinero', autoridad_salud: 'Secretaría', razon_social: 'Razón', nit: '900' };

  it('lista los campos con corchetes, también en parte del texto', () => {
    const lista = camposPorLlenar(
      [{ id: 'a1', nombre: 'Crema', registro_sanitario: 'INVIMA [número]' }],
      config({ ...completa, whatsapp: '57[número]', horario: 'Lunes a viernes' }),
      [{ id: 'b1', titulo: '[Marca]: 15 %', activo: 'si' }],
    );
    expect(lista).toEqual([
      'Configuracion: whatsapp',
      'Anuncios, fila 2 (id b1): titulo',
      'Productos, fila 2 (id a1): registro_sanitario',
    ]);
  });

  it('avisa si falta una clave que el sitio llena con un respaldo entre corchetes', () => {
    expect(camposPorLlenar([], config({ barrio: 'Chapinero', razon_social: 'Razón', nit: '900' }), [])).toEqual([
      'Configuracion: autoridad_salud',
    ]);
  });

  it('ignora los anuncios inactivos y las notas de la configuración', () => {
    const filas = [...config(completa), { clave: 'costo_domicilio', valor: '0', notas: '[valor] para pedidos menores' }];
    expect(camposPorLlenar([], filas, [{ id: 'b1', titulo: '[Marca]', activo: 'no' }])).toEqual([]);
  });
});

describe('frase del profesional', () => {
  const claves = (frase: string) =>
    Object.entries({
      nombre_drogueria: 'D', whatsapp: '573001234567', domicilio_gratis_desde: '60000', tiempo_entrega: '1 h',
      zonas_cobertura: 'Z', horario: 'H', profesional_nombre: 'N', profesional_profesion: 'P', profesional_registro: 'R',
      drogueria_codigo_inscripcion: 'C', profesional_frase: frase,
    }).map(([clave, valor]) => ({ clave, valor }));

  it(`avisa si pasa de ${FRASE_MAX} caracteres`, () => {
    expect(validarConfiguracion(claves('a'.repeat(FRASE_MAX))).avisos).toEqual([]);
    expect(validarConfiguracion(claves('a'.repeat(FRASE_MAX + 1))).avisos[0]).toContain('profesional_frase');
  });
});

describe('avisos de la barra', () => {
  const claves = (aviso: string) =>
    Object.entries({
      nombre_drogueria: 'D', whatsapp: '573001234567', domicilio_gratis_desde: '60000', tiempo_entrega: '1 h',
      zonas_cobertura: 'Z', horario: 'H', profesional_nombre: 'N', profesional_profesion: 'P', profesional_registro: 'R',
      drogueria_codigo_inscripcion: 'C', aviso_2: aviso,
    }).map(([clave, valor]) => ({ clave, valor }));

  it(`avisa si un anuncio pasa de ${AVISO_MAX} caracteres`, () => {
    expect(validarConfiguracion(claves('a'.repeat(AVISO_MAX))).avisos).toEqual([]);
    expect(validarConfiguracion(claves('a'.repeat(AVISO_MAX + 1))).avisos[0]).toContain('aviso_2');
  });
});
