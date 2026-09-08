import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/** Texto que la barbería publica para que el cliente la reconozca (CAR-01, CAR-07). */
export class DescripcionBarberia {
  private static readonly LONGITUD_MAXIMA = 500;

  private constructor(private readonly valor: string) {}

  static desde(valor: string): DescripcionBarberia {
    const limpio = (valor ?? "").trim();
    if (limpio.length > DescripcionBarberia.LONGITUD_MAXIMA) {
      throw new ErrorDeValidacion(
        `La descripción no puede superar ${DescripcionBarberia.LONGITUD_MAXIMA} caracteres.`,
      );
    }
    return new DescripcionBarberia(limpio);
  }

  static vacia(): DescripcionBarberia {
    return new DescripcionBarberia("");
  }

  get valorPrimitivo(): string {
    return this.valor;
  }

  estaVacia(): boolean {
    return this.valor.length === 0;
  }

  toString(): string {
    return this.valor;
  }
}
