import { normalizarTelefono, type Barberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'

/** Error de negocio: ya hay una barbería registrada con ese correo. La ruta HTTP lo traduce a 409. */
export class CorreoDeBarberiaYaRegistrado extends Error {
  /** @param correo Correo repetido, ya normalizado. */
  constructor(correo: string) {
    super(`Ya existe una barbería registrada con el correo ${correo}`)
  }
}

/** Datos de entrada del registro de una barbería, ya validados en la frontera HTTP. */
export interface RegistroBarberiaDTO {
  nombre: string
  descripcion: string
  direccion: string
  ciudad: string
  telefono: string
  correo: string
}

/**
 * Caso de uso: un administrador registra su barbería en la plataforma (CAR-01).
 *
 * La barbería nace en PENDIENTE_VERIFICACION y no es visible para los clientes hasta que el
 * operador la habilite (CAR-02, RES-11).
 */
export class RegistrarBarberia {
  /** @param barberias Acceso a datos de las barberías. */
  constructor(private readonly barberias: BarberiaDAO) {}

  /**
   * Normaliza los datos y registra la barbería. La normalización es del negocio y no de HTTP:
   * vale igual para cualquier canal de entrada.
   *
   * @param datos Datos del registro, ya validados en la frontera HTTP.
   * @returns La barbería registrada, con su id y en estado PENDIENTE_VERIFICACION.
   * @throws {CorreoDeBarberiaYaRegistrado} Si otra barbería ya usa ese correo, sin distinguir mayúsculas.
   */
  async ejecutar(datos: RegistroBarberiaDTO): Promise<Barberia> {
    const correo = datos.correo.trim().toLowerCase()
    if (await this.barberias.porCorreo(correo)) throw new CorreoDeBarberiaYaRegistrado(correo)

    // Nace pendiente: nadie puede registrarla habilitada, eso lo decide el operador (CAR-02).
    return this.barberias.guardar({
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      direccion: datos.direccion.trim(),
      ciudad: datos.ciudad.trim(),
      telefono: normalizarTelefono(datos.telefono),
      correo,
      estado: 'PENDIENTE_VERIFICACION',
      motivoSuspension: null,
    })
  }
}
