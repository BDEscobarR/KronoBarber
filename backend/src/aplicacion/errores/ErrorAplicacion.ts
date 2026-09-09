/**
 * Errores de orquestación: no son reglas del negocio, son fallos del caso de uso.
 *
 * La diferencia con `ErrorDominio` es de quién sabe la respuesta. Que una
 * barbería suspendida no pueda editarse lo sabe el agregado; que no exista
 * ninguna barbería con ese identificador solo se descubre al consultar el
 * repositorio, y eso ocurre en el caso de uso.
 *
 * Al igual que los del dominio, cada hijo determina un código HTTP distinto
 * (ver `manejadorDeErrores`).
 */
export abstract class ErrorAplicacion extends Error {
  protected constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** No hay ninguna barbería con ese identificador. Se traduce a **HTTP 404**. */
export class BarberiaNoEncontrada extends ErrorAplicacion {
  constructor(idBarberia: string) {
    super(`No existe una barbería con el identificador «${idBarberia}».`);
  }
}

/**
 * El correo ya está tomado. Se traduce a **HTTP 409**.
 *
 * Lo detecta el caso de uso antes de guardar, pero también lo lanza el
 * adaptador SQL al traducir la violación del índice único: la comprobación
 * previa no basta si dos altas llegan a la vez.
 */
export class CorreoDeBarberiaYaRegistrado extends ErrorAplicacion {
  constructor(correo: string) {
    super(`Ya existe una barbería registrada con el correo «${correo}».`);
  }
}

/**
 * El solicitante intenta operar sobre una barbería que no es la suya. Es la
 * defensa del aislamiento multiempresa (RES-02). Se traduce a **HTTP 403**.
 */
export class AccesoNoAutorizado extends ErrorAplicacion {
  constructor(detalle: string) {
    super(`Acceso no autorizado: ${detalle}`);
  }
}

/** No hay ningún servicio con ese identificador. Se traduce a **HTTP 404**. */
export class ServicioNoEncontrado extends ErrorAplicacion {
  constructor(idServicio: string) {
    super(`No existe un servicio con el identificador «${idServicio}».`);
  }
}

/**
 * La barbería ya tiene un servicio con ese nombre. Se traduce a **HTTP 409**.
 *
 * El nombre es la llave natural **dentro de una barbería**: dos barberías
 * distintas sí pueden ofrecer «Corte clásico». Lo detecta el caso de uso antes
 * de guardar, y también el adaptador SQL al traducir la violación del índice
 * único, porque la comprobación previa no basta si dos altas llegan a la vez.
 */
export class NombreDeServicioYaRegistrado extends ErrorAplicacion {
  constructor(nombre: string) {
    super(`Esta barbería ya tiene un servicio llamado «${nombre}».`);
  }
}
