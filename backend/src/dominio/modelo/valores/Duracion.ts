import { ErrorDeValidacion } from "../../errores/ErrorDominio";

/**
 * Objeto de valor compartido: duración en minutos.
 *
 * En el catálogo es la duración estimada del servicio, y de ella depende el
 * tamaño del espacio que el turno ocupa en la agenda (CAR-03, CAR-09). Por eso
 * es un valor del dominio y no un `number`: quien calcule la disponibilidad
 * debe recibir algo que ya se validó.
 *
 * Se exige múltiplo de `PASO_MINUTOS` para que los espacios libres queden
 * alineados en una rejilla y el calendario no ofrezca huecos de tres minutos
 * imposibles de reservar.
 */
export class Duracion {
  /** Rejilla de la agenda. Cambiarla aquí cambia la granularidad de todo el sistema. */
  static readonly PASO_MINUTOS = 5;
  private static readonly MINIMO_MINUTOS = 5;
  /** Ocho horas: nadie presta un servicio de barbería más largo que una jornada. */
  private static readonly MAXIMO_MINUTOS = 480;

  private constructor(private readonly minutos: number) {}

  static desdeMinutos(minutos: number): Duracion {
    if (!Number.isFinite(minutos) || !Number.isInteger(minutos)) {
      throw new ErrorDeValidacion("La duración debe expresarse en minutos enteros.");
    }
    if (minutos < Duracion.MINIMO_MINUTOS) {
      throw new ErrorDeValidacion(
        `La duración debe ser de al menos ${Duracion.MINIMO_MINUTOS} minutos.`,
      );
    }
    if (minutos > Duracion.MAXIMO_MINUTOS) {
      throw new ErrorDeValidacion(
        `La duración no puede superar ${Duracion.MAXIMO_MINUTOS} minutos.`,
      );
    }
    if (minutos % Duracion.PASO_MINUTOS !== 0) {
      throw new ErrorDeValidacion(
        `La duración debe ser múltiplo de ${Duracion.PASO_MINUTOS} minutos para encajar en la agenda.`,
      );
    }
    return new Duracion(minutos);
  }

  get valorEnMinutos(): number {
    return this.minutos;
  }

  /** Milisegundos, para sumar sobre un instante al calcular el fin de un turno. */
  get valorEnMilisegundos(): number {
    return this.minutos * 60_000;
  }

  esIgualA(otra: Duracion): boolean {
    return this.minutos === otra.minutos;
  }

  toString(): string {
    return `${this.minutos} min`;
  }
}
