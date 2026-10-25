import type { Servicio } from '../../dominio/modelo/Servicio'
import type { ServicioDAO } from '../../dominio/puertos'
import { ServicioYaExiste } from './CrearServicio'

/** Datos editables de un servicio. La descripción, barbería, estado e identidad se conservan. */
export interface ActualizacionServicioDTO {
  nombre: string
  precio: number
  duracionMinutos: number
}

/** Error de negocio: no existe el servicio indicado dentro de la barbería de la ruta. */
export class ServicioNoEncontrado extends Error {
  constructor() {
    super('Servicio no encontrado en esta barbería')
  }
}

/** Actualiza los datos comerciales de un servicio, incluso si está inactivo. */
export class ActualizarServicio {
  constructor(private readonly servicios: ServicioDAO) {}

  async ejecutar(barberiaId: string, id: string, datos: ActualizacionServicioDTO): Promise<Servicio> {
    const nombre = datos.nombre.trim()
    const existente = await this.servicios.porNombre(barberiaId, nombre)
    if (existente && existente.id !== id) throw new ServicioYaExiste(nombre)
    const actualizado = await this.servicios.actualizar(id, barberiaId, {
      ...datos,
      nombre,
    })
    if (!actualizado) throw new ServicioNoEncontrado()
    return actualizado
  }
}
