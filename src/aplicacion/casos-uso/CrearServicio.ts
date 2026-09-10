import type { Servicio } from '../../dominio/modelo/Servicio'
import type { BarberiaDAO, ServicioDAO } from '../../dominio/puertos'
import { BarberiaNoEncontrada } from './HabilitarBarberia'

/**
 * Error de negocio: la barbería ya tiene un servicio con ese nombre, sin distinguir mayúsculas.
 * La ruta HTTP lo traduce a 409.
 */
export class ServicioYaExiste extends Error {
  /** @param nombre Nombre repetido. */
  constructor(nombre: string) {
    super(`La barbería ya tiene un servicio llamado "${nombre}"`)
  }
}

/** Datos de entrada de un servicio nuevo, ya validados en la frontera HTTP. */
export interface CreacionServicioDTO {
  barberiaId: string
  nombre: string
  descripcion: string
  precio: number
  duracionMinutos: number
}

/**
 * Caso de uso: el administrador agrega un servicio al catálogo de su barbería (CAR-03).
 *
 * Depende de dos puertos, y es correcto: el catálogo no puede colgar de una barbería que no
 * existe, y eso solo se descubre consultando sus datos.
 */
export class CrearServicio {
  /**
   * @param barberias Acceso a datos de las barberías, para comprobar que la dueña existe.
   * @param servicios Acceso a datos del catálogo.
   */
  constructor(
    private readonly barberias: BarberiaDAO,
    private readonly servicios: ServicioDAO,
  ) {}

  /**
   * Crea el servicio, activo, en el catálogo de la barbería.
   *
   * @param datos Datos del servicio, ya validados en la frontera HTTP.
   * @returns El servicio creado, con su id.
   * @throws {BarberiaNoEncontrada} Si la barbería no existe.
   * @throws {ServicioYaExiste} Si la barbería ya tiene un servicio con ese nombre.
   */
  async ejecutar(datos: CreacionServicioDTO): Promise<Servicio> {
    // No se exige que esté habilitada: configurar el catálogo es parte de la puesta en
    // marcha. RES-11 condiciona la visibilidad y las reservas, no la configuración.
    if (!(await this.barberias.porId(datos.barberiaId))) throw new BarberiaNoEncontrada(datos.barberiaId)

    const nombre = datos.nombre.trim()
    // El nombre es único dentro de la barbería, sin distinguir mayúsculas.
    if (await this.servicios.porNombre(datos.barberiaId, nombre)) throw new ServicioYaExiste(nombre)

    // Nace activo: quien decide si el catálogo se ve es el estado de la barbería.
    return this.servicios.guardar({
      barberiaId: datos.barberiaId,
      nombre,
      descripcion: datos.descripcion.trim(),
      precio: datos.precio,
      duracionMinutos: datos.duracionMinutos,
      activo: true,
    })
  }
}
