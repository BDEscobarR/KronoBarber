import { ErrorDeValidacion } from "../../errores/ErrorDominio";

export interface DatosUbicacion {
  readonly direccion: string;
  readonly ciudad: string;
}

/**
 * Ubicación de la única sede de la barbería (SUP-03: una barbería = una sede).
 *
 * No se guardan coordenadas ni país: el alcance es una sola ciudad por
 * establecimiento. Si algún día se admiten cadenas con varias sedes, este
 * objeto de valor deja de pertenecer a `Barberia` y pasa a la sede.
 */
export class Ubicacion {
  private static readonly LONGITUD_MINIMA_DIRECCION = 5;
  private static readonly LONGITUD_MINIMA_CIUDAD = 3;

  private constructor(
    private readonly direccion: string,
    private readonly ciudad: string,
  ) {}

  static desde(datos: DatosUbicacion): Ubicacion {
    const direccion = (datos?.direccion ?? "").trim().replace(/\s+/g, " ");
    const ciudad = (datos?.ciudad ?? "").trim().replace(/\s+/g, " ");

    if (direccion.length < Ubicacion.LONGITUD_MINIMA_DIRECCION) {
      throw new ErrorDeValidacion(
        `La dirección de la barbería debe tener al menos ${Ubicacion.LONGITUD_MINIMA_DIRECCION} caracteres.`,
      );
    }
    if (ciudad.length < Ubicacion.LONGITUD_MINIMA_CIUDAD) {
      throw new ErrorDeValidacion(
        `La ciudad de la barbería debe tener al menos ${Ubicacion.LONGITUD_MINIMA_CIUDAD} caracteres.`,
      );
    }
    return new Ubicacion(direccion, ciudad);
  }

  get direccionCompleta(): string {
    return this.direccion;
  }

  get ciudadValor(): string {
    return this.ciudad;
  }

  esIgualA(otra: Ubicacion): boolean {
    return this.direccion === otra.direccion && this.ciudad === otra.ciudad;
  }

  toString(): string {
    return `${this.direccion}, ${this.ciudad}`;
  }
}
