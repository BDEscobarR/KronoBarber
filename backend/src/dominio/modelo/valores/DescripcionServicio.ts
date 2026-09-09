import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/** Detalle opcional de qué incluye el servicio, visible en el catálogo (CAR-07). */
export class DescripcionServicio {
  private static readonly LONGITUD_MAXIMA = 300;

  private constructor(private readonly valor: string) {}

  static desde(valor: string): DescripcionServicio {
    const limpio = (valor ?? "").trim();
    if (limpio.length > DescripcionServicio.LONGITUD_MAXIMA) {
      throw new ErrorDeValidacion(
        `La descripción del servicio no puede superar ${DescripcionServicio.LONGITUD_MAXIMA} caracteres.`,
      );
    }
    return new DescripcionServicio(limpio);
  }

  static vacia(): DescripcionServicio {
    return new DescripcionServicio("");
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
