import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/**
 * Nombre del servicio tal como lo ve el cliente en el catálogo (CAR-03, CAR-07).
 *
 * `esIgualA` ignora mayúsculas a propósito: es la comparación con la que el
 * caso de uso detecta que una barbería intenta crear «Corte clásico» cuando ya
 * tiene «CORTE CLÁSICO». Dos entradas del catálogo que el cliente leería igual
 * son el mismo servicio.
 */
export class NombreServicio {
  private static readonly LONGITUD_MINIMA = 3;
  private static readonly LONGITUD_MAXIMA = 80;

  private constructor(private readonly valor: string) {}

  static desde(valor: string): NombreServicio {
    const limpio = (valor ?? "").trim().replace(/\s+/g, " ");
    if (limpio.length < NombreServicio.LONGITUD_MINIMA) {
      throw new ErrorDeValidacion(
        `El nombre del servicio debe tener al menos ${NombreServicio.LONGITUD_MINIMA} caracteres.`,
      );
    }
    if (limpio.length > NombreServicio.LONGITUD_MAXIMA) {
      throw new ErrorDeValidacion(
        `El nombre del servicio no puede superar ${NombreServicio.LONGITUD_MAXIMA} caracteres.`,
      );
    }
    return new NombreServicio(limpio);
  }

  get valorPrimitivo(): string {
    return this.valor;
  }

  esIgualA(otro: NombreServicio): boolean {
    return this.valor.toLowerCase() === otro.valor.toLowerCase();
  }

  toString(): string {
    return this.valor;
  }
}
