import { describe, expect, it } from 'vitest';
import { validarDatosEntrega } from '../pedido';

describe('validarDatosEntrega', () => {
  it('pide los tres datos, en el orden del formulario', () => {
    expect(Object.keys(validarDatosEntrega({ nombre: ' ', direccion: '', autorizo: false }))).toEqual(['nombre', 'direccion', 'autorizo']);
  });

  it('no devuelve errores con los datos completos', () => {
    expect(validarDatosEntrega({ nombre: 'Ana', direccion: 'Cra 1', autorizo: true })).toEqual({});
  });
});
