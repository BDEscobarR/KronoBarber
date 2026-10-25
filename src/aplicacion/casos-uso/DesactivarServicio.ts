import type { Servicio } from '../../dominio/modelo/Servicio'
import type { ServicioDAO } from '../../dominio/puertos'
import { ServicioNoEncontrado } from './ActualizarServicio'

/** Error de negocio: el servicio ya estaba inactivo. La ruta HTTP lo traduce a 409. */
export class ServicioYaInactivo extends Error {
  constructor() {
    super('El servicio ya está inactivo')
  }
}

/**
 * Caso de uso: el administrador retira un servicio de la vitrina sin borrarlo (CAR-03, D-04).
 *
 * Inactivo, el servicio no se muestra al público ni se puede reservar, pero sigue en el catálogo de
 * gestión y se puede editar. Los turnos ya reservados no cambian: el turno copia precio y duración.
 */
export class DesactivarServicio {
  /** @param servicios Acceso a datos del catálogo. */
  constructor(private readonly servicios: ServicioDAO) {}

  /**
   * Desactiva el servicio.
   *
   * @param barberiaId Barbería tomada de la URL; el servicio tiene que ser suyo (RES-02).
   * @param id Identificador del servicio.
   * @returns El servicio con `activo` en `false`.
   * @throws {ServicioNoEncontrado} Si esa barbería no tiene un servicio con ese id.
   * @throws {ServicioYaInactivo} Si ya estaba inactivo.
   */
  async ejecutar(barberiaId: string, id: string): Promise<Servicio> {
    const servicio = await this.servicios.porId(barberiaId, id)
    if (!servicio) throw new ServicioNoEncontrado()
    // Desactivar dos veces es un error, no una operación vacía, igual que habilitar una barbería ya
    // habilitada: el administrador debe saber que no cambió nada (D-04).
    if (!servicio.activo) throw new ServicioYaInactivo()

    return this.servicios.cambiarEstado(id, false)
  }
}
