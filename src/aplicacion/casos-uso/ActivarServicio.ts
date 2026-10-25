import type { Servicio } from '../../dominio/modelo/Servicio'
import type { ServicioDAO } from '../../dominio/puertos'
import { ServicioNoEncontrado } from './ActualizarServicio'

/** Error de negocio: el servicio ya estaba activo. La ruta HTTP lo traduce a 409. */
export class ServicioYaActivo extends Error {
  constructor() {
    super('El servicio ya está activo')
  }
}

/**
 * Caso de uso: el administrador vuelve a ofrecer un servicio que había retirado de la vitrina
 * (CAR-03, D-04). Vuelve tal como quedó, con lo que se haya editado mientras estuvo inactivo.
 */
export class ActivarServicio {
  /** @param servicios Acceso a datos del catálogo. */
  constructor(private readonly servicios: ServicioDAO) {}

  /**
   * Activa el servicio.
   *
   * @param barberiaId Barbería tomada de la URL; el servicio tiene que ser suyo (RES-02).
   * @param id Identificador del servicio.
   * @returns El servicio con `activo` en `true`.
   * @throws {ServicioNoEncontrado} Si esa barbería no tiene un servicio con ese id.
   * @throws {ServicioYaActivo} Si ya estaba activo.
   */
  async ejecutar(barberiaId: string, id: string): Promise<Servicio> {
    const servicio = await this.servicios.porId(barberiaId, id)
    if (!servicio) throw new ServicioNoEncontrado()
    // Activar uno activo es un error, no una operación vacía (D-04): igual que con la barbería.
    if (servicio.activo) throw new ServicioYaActivo()

    return this.servicios.cambiarEstado(id, true)
  }
}
