import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/**
 * Identificador del servicio dentro del catálogo de una barbería.
 *
 * Es una clase y no un `string` para que el compilador impida pasar un
 * `IdBarberia` donde se espera un `IdServicio`. Los dos son texto en tiempo
 * de ejecución; solo el tipo los distingue.
 */
export class IdServicio {
  private constructor(private readonly valor: string) {}

  static desde(valor: string): IdServicio {
    const limpio = (valor ?? "").trim();
    if (limpio.length === 0) {
      throw new ErrorDeValidacion("El identificador del servicio no puede estar vacío.");
    }
    return new IdServicio(limpio);
  }

  get valorPrimitivo(): string {
    return this.valor;
  }

  esIgualA(otro: IdServicio): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
