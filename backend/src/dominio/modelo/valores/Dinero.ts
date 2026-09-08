import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/**
 * Objeto de valor compartido: importe en **pesos colombianos enteros** (RES-06).
 */
export class Dinero {
  /** Moneda única de la plataforma (RES-06). No hay multi-moneda en esta versión. */
  static readonly MONEDA = "COP" as const;

  /** Tope defensivo: cien millones de pesos, muy por encima de cualquier corte. */
  private static readonly MAXIMO = 100_000_000;

  private constructor(private readonly pesos: number) {}

  static desdePesos(pesos: number): Dinero {
    if (!Number.isFinite(pesos)) {
      throw new ErrorDeValidacion("El importe debe ser un número.");
    }
    if (!Number.isInteger(pesos)) {
      throw new ErrorDeValidacion(
        "El importe debe expresarse en pesos enteros: la plataforma no maneja centavos.",
      );
    }
    if (pesos < 0) {
      throw new ErrorDeValidacion("El importe no puede ser negativo.");
    }
    if (pesos > Dinero.MAXIMO) {
      throw new ErrorDeValidacion("El importe supera el máximo admitido por la plataforma.");
    }
    return new Dinero(pesos);
  }

  static cero(): Dinero {
    return new Dinero(0);
  }

  get valorEnPesos(): number {
    return this.pesos;
  }

  esCero(): boolean {
    return this.pesos === 0;
  }

  /**
   * **redondeada al peso más cercano**.
   */
  porcentaje(porcentaje: number): Dinero {
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      throw new ErrorDeValidacion("El porcentaje debe estar entre 0 y 100.");
    }
    return new Dinero(Math.round((this.pesos * porcentaje) / 100));
  }

  restar(otro: Dinero): Dinero {
    if (otro.pesos > this.pesos) {
      throw new ErrorDeValidacion("El resultado de la resta no puede ser negativo.");
    }
    return new Dinero(this.pesos - otro.pesos);
  }

  esIgualA(otro: Dinero): boolean {
    return this.pesos === otro.pesos;
  }

  /** Solo para bitácora y mensajes de error: dar formato es del borde. */
  toString(): string {
    return `${this.pesos} ${Dinero.MONEDA}`;
  }
}
