import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/** Nombre comercial visible para los clientes (CAR-01). */
export class NombreBarberia {
  private static readonly LONGITUD_MINIMA = 3;
  private static readonly LONGITUD_MAXIMA = 80;

  private constructor(private readonly valor: string) {}

  static desde(valor: string): NombreBarberia {
    const limpio = (valor ?? "").trim().replace(/\s+/g, " ");
    if (limpio.length < NombreBarberia.LONGITUD_MINIMA) {
      throw new ErrorDeValidacion(
        `El nombre de la barbería debe tener al menos ${NombreBarberia.LONGITUD_MINIMA} caracteres.`,
      );
    }
    if (limpio.length > NombreBarberia.LONGITUD_MAXIMA) {
      throw new ErrorDeValidacion(
        `El nombre de la barbería no puede superar ${NombreBarberia.LONGITUD_MAXIMA} caracteres.`,
      );
    }
    return new NombreBarberia(limpio);
  }

  get valorPrimitivo(): string {
    return this.valor;
  }

  esIgualA(otro: NombreBarberia): boolean {
    return this.valor.toLowerCase() === otro.valor.toLowerCase();
  }

  toString(): string {
    return this.valor;
  }
}
