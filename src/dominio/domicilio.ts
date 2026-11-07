import { formatearPrecio } from './formato';

export interface ProgresoDomicilio {
  falta: number;
  porcentaje: number;
  gratis: boolean;
}

export function progresoDomicilio(total: number, umbral: number): ProgresoDomicilio {
  if (umbral <= 0) return { falta: 0, porcentaje: 100, gratis: true };
  const falta = Math.max(0, umbral - total);
  return {
    falta,
    porcentaje: Math.min(100, Math.round((total / umbral) * 100)),
    gratis: falta === 0,
  };
}

export function textoDomicilio(total: number, unidades: number, umbral: number): string {
  const { falta, gratis } = progresoDomicilio(total, umbral);
  if (unidades === 0) return `Domicilio gratis desde ${formatearPrecio(umbral)}`;
  return gratis ? 'Tu domicilio es gratis' : `Te faltan ${formatearPrecio(falta)} para el domicilio gratis`;
}
