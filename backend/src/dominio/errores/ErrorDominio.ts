/**
 * Errores del dominio.
 */
export abstract class ErrorDominio extends Error {
  protected constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class ErrorDeValidacion extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ErrorDeTransicion extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}