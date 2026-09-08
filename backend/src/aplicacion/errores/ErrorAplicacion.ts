/** Errores de orquestación: no son reglas del negocio, son fallos del caso de uso. */
export abstract class ErrorAplicacion extends Error {
  protected constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class BarberiaNoEncontrada extends ErrorAplicacion {
  constructor(idBarberia: string) {
    super(`No existe una barbería con el identificador «${idBarberia}».`);
  }
}

export class CorreoDeBarberiaYaRegistrado extends ErrorAplicacion {
  constructor(correo: string) {
    super(`Ya existe una barbería registrada con el correo «${correo}».`);
  }
}

export class AccesoNoAutorizado extends ErrorAplicacion {
  constructor(detalle: string) {
    super(`Acceso no autorizado: ${detalle}`);
  }
}