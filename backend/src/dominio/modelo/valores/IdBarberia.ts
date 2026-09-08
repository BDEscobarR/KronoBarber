import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/**
 * Identificador de la barbería. Es además la clave de aislamiento
 * multiempresa (RES-02): todo dato de negocio cuelga de una barbería.
 *
 * Es una clase y no un `string` suelto para que el compilador impida pasar
 * el identificador de un barbero o de un servicio donde se espera una barbería.
 */
export class IdBarberia {
  private constructor(private readonly valor: string) {}

  static desde(valor: string): IdBarberia {
    const limpio = (valor ?? "").trim();
    if (limpio.length === 0) {
      throw new ErrorDeValidacion("El identificador de la barbería no puede estar vacío.");
    }
    return new IdBarberia(limpio);
  }

  get valorPrimitivo(): string {
    return this.valor;
  }

  esIgualA(otro: IdBarberia): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
