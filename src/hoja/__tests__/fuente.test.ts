import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { leerTabla } from '../leerTabla';

let servidor: Server;
let base = '';

beforeAll(async () => {
  servidor = createServer((req, res) => {
    if (req.url === '/productos.csv') {
      res.writeHead(200, { 'Content-Type': 'text/csv' });
      res.end('id,nombre\nz1,Desde Sheets\n');
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

afterAll(() => servidor.close());
afterEach(() => vi.unstubAllEnvs());

describe('leerTabla', () => {
  it('sin URL configurada usa la copia local', async () => {
    vi.stubEnv('SHEETS_PRODUCTOS_CSV_URL', '');
    const { origen, filas } = await leerTabla('productos');
    expect(origen).toContain('datos/productos.csv');
    expect(filas).toHaveLength(24);
  });

  it('con URL descarga la pestaña publicada', async () => {
    vi.stubEnv('SHEETS_PRODUCTOS_CSV_URL', `${base}/productos.csv`);
    const { origen, filas } = await leerTabla('productos');
    expect(origen).toBe('Google Sheets');
    expect(filas).toEqual([{ id: 'z1', nombre: 'Desde Sheets' }]);
  });

  it('si la descarga falla en desarrollo, usa la copia local', async () => {
    vi.stubEnv('SHEETS_PRODUCTOS_CSV_URL', `${base}/no-existe.csv`);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { origen } = await leerTabla('productos');
    expect(origen).toContain('datos/productos.csv');
  });

  it('si la descarga falla en el build, falla con un mensaje claro', async () => {
    vi.stubEnv('SHEETS_PRODUCTOS_CSV_URL', `${base}/no-existe.csv`);
    vi.stubEnv('DEV', false);
    await expect(leerTabla('productos')).rejects.toThrow(
      'No se pudo descargar la pestaña «productos» (HTTP 404). Revisa la URL publicada.',
    );
  });
});
