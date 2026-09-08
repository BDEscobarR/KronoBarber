/**
 * Errores del dominio: una regla de negocio que se intentó romper.
 *
 * Son abstractos a propósito. Nadie lanza un `ErrorDominio` genérico: se
 * elige uno de los dos hijos, porque de esa elección depende el código HTTP
 * con el que el usuario recibe el fallo (ver `manejadorDeErrores`).
 *
 * El dominio no sabe que existe HTTP; solo dice *qué clase de error* es, y
 * la infraestructura lo traduce.
 *
 * El mensaje va en español y dirigido a una persona: llega tal cual al
 * cliente. Nunca incluir datos personales ni credenciales.
 */
export abstract class ErrorDominio extends Error {
  protected constructor(mensaje: string) {
    super(mensaje);
    // `new.target` es la clase concreta que se instanció, así el nombre que
    // viaja en la respuesta es «ErrorDeValidacion» y no «ErrorDominio».
    this.name = new.target.name;
  }
}

/**
 * Un dato no cumple las reglas para existir: nombre demasiado corto, correo
 * mal formado, teléfono inválido, motivo de suspensión insuficiente.
 *
 * Se traduce a **HTTP 400**. Es culpa de lo que se envió, y reintentar lo
 * mismo volverá a fallar.
 */
export class ErrorDeValidacion extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/**
 * Los datos son correctos, pero la operación no cabe en el estado actual del
 * agregado: habilitar una barbería ya habilitada, editar el perfil de una
 * suspendida.
 *
 * Se traduce a **HTTP 409**. No es culpa del dato sino del momento: la misma
 * petición podría funcionar más tarde.
 */
export class ErrorDeTransicion extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}
