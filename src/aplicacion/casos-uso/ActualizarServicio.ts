import type { Servicio } from '../../dominio/modelo/Servicio'
import type { ServicioDAO } from '../../dominio/puertos'
import { ServicioYaExiste } from './CrearServicio'

/**
 * Datos editables de un servicio, ya validados en la frontera HTTP. La barbería, el estado y la identidad
 * se conservan.
 */
export interface ActualizacionServicioDTO {
  nombre: string
  /** Descripción nueva; `null` conserva la que tenía (D-05). */
  descripcion: string | null
  precio: number
  duracionMinutos: number
}

/** Error de negocio: no existe el servicio indicado dentro de la barbería de la ruta. */
export class ServicioNoEncontrado extends Error {
  constructor() {
    super('Servicio no encontrado en esta barbería')
  }
}

/**
 * Caso de uso: el administrador edita los datos de un servicio de su catálogo (CAR-03), incluso si está
 * inactivo, por si lo vuelve a activar. Los turnos ya reservados no cambian: el turno copia precio y
 * duración al reservarse.
 */
export class ActualizarServicio {
  /** @param servicios Acceso a datos del catálogo. */
  constructor(private readonly servicios: ServicioDAO) {}

  /**
   * Normaliza los datos y actualiza el servicio.
   *
   * @param barberiaId Barbería tomada de la URL; el servicio tiene que ser suyo (RES-02).
   * @param id Identificador del servicio.
   * @param datos Datos editables, ya validados en la frontera HTTP.
   * @returns El servicio actualizado.
   * @throws {ServicioYaExiste} Si otro servicio de la barbería ya usa ese nombre.
   * @throws {ServicioNoEncontrado} Si esa barbería no tiene un servicio con ese id.
   */
  async ejecutar(barberiaId: string, id: string, datos: ActualizacionServicioDTO): Promise<Servicio> {
    const nombre = datos.nombre.trim()
    const existente = await this.servicios.porNombre(barberiaId, nombre)
    if (existente && existente.id !== id) throw new ServicioYaExiste(nombre)
    const actualizado = await this.servicios.actualizar(id, barberiaId, {
      ...datos,
      nombre,
      descripcion: datos.descripcion === null ? null : datos.descripcion.trim(),
    })
    if (!actualizado) throw new ServicioNoEncontrado()
    return actualizado
  }
}
