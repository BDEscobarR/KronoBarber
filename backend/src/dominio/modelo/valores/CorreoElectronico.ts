import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/**
 * Objeto de valor compartido: lo usan la barbería, el barbero y el cliente.
 * Vive en `valores/` porque no pertenece a un solo agregado.
 */
export class CorreoElectronico {
  private static readonly PATRON = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private static readonly LONGITUD_MAXIMA = 254;

  private constructor(private readonly valor: string) {}

  static desde(valor: string): CorreoElectronico {
    const limpio = (valor ?? "").trim().toLowerCase();
    if (limpio.length === 0) {
      throw new ErrorDeValidacion("El correo electrónico es obligatorio.");
    }
    if (limpio.length > CorreoElectronico.LONGITUD_MAXIMA || !CorreoElectronico.PATRON.test(limpio)) {
      throw new ErrorDeValidacion(`El correo electrónico «${valor}» no tiene un formato válido.`);
    }
    return new CorreoElectronico(limpio);
  }

  get valorPrimitivo(): string {
    return this.valor;
  }

  esIgualA(otro: CorreoElectronico): boolean {
    return this.valor === otro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
