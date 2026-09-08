import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/**
 * Teléfono de contacto. Se normaliza quitando separadores para que
 * «(606) 887-1234» y «6068871234» sean el mismo valor.
 */
export class Telefono {
  private static readonly PATRON = /^\+?\d{7,15}$/;

  private constructor(private readonly valor: string) {}

  static desde(valor: string): Telefono {
    const limpio = (valor ?? "").replace(/[\s()\-.]/g, "");
    if (limpio.length === 0) {
      throw new ErrorDeValidacion("El teléfono de contacto es obligatorio.");
    }
    if (!Telefono.PATRON.test(limpio)) {
      throw new ErrorDeValidacion(
        `El teléfono «${valor}» no es válido: se esperan entre 7 y 15 dígitos, con prefijo internacional opcional.`,
      );
    }
    return new Telefono(limpio);
  }

  get valorPrimitivo(): string {
    return this.valor;
  }

  esIgualA(otro: Telefono): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
