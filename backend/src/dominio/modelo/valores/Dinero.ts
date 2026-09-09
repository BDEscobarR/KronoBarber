import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/**
 * Objeto de valor compartido: importe en **pesos colombianos enteros** (RES-06).
 */
export class Dinero {
  /** Moneda única de la plataforma (RES-06). No hay multi-moneda en esta versión. */
  static readonly MONEDA = "COP" as const;

  /**
   * Tope defensivo: cien millones de pesos, muy por encima de cualquier corte.
   *
   * No sale del Documento de Visión: es una decisión del equipo para atajar
   * un dedazo al teclear un precio, no una regla de negocio. Si algún día un
   * importe legítimo se acerca a este número, súbelo sin más ceremonia.
   */
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
   * Devuelve la fracción indicada de este importe, **redondeada al peso más
   * cercano**. Es el único sitio del sistema donde se calcula un porcentaje de
   * dinero, y por tanto el único que decide el redondeo (README §9).
   *
   * De aquí sale el anticipo del 20 % (regla 1, CAR-10). Como la plataforma
   * trabaja en pesos enteros, el 20 % casi nunca cae exacto: un servicio de
   * 23.333 da 4.666,6 y el anticipo queda en 4.667. La mitad se redondea
   * hacia arriba, así que la diferencia favorece siempre a la barbería y
   * nunca supera un peso.
   *
   * El saldo **debe** calcularse con `restar` y no con otro `porcentaje(80)`:
   * restando se garantiza que anticipo + saldo dé exactamente el total,
   * mientras que dos redondeos independientes pueden desviarse un peso.
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
