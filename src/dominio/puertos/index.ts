// Puertos: lo que el dominio necesita del exterior, en su propio vocabulario.
//
// - `...DAO`: acceso a datos, quien sepa guardar y recuperar entidades.
// - `...DTO`: estructura de datos que cruza una frontera.
// - Sin sufijo: contratos de comportamiento, que no son ni datos ni persistencia.

import type { Barberia, BarberiaNueva, EstadoBarberia } from '../modelo/Barberia'
import type { Servicio, ServicioNuevo } from '../modelo/Servicio'

/**
 * Acceso a datos de las barberías. Lo declara el dominio y lo implementa la infraestructura
 * (`BarberiaDAOPrisma`); las pruebas usan un doble en memoria.
 *
 * Ningún método lanza por "no encontrado": devolver `null` es un resultado normal y decidir qué
 * hacer con él es del caso de uso.
 */
export interface BarberiaDAO {
  /**
   * Persiste una barbería nueva.
   *
   * @param barberia Datos completos, sin id.
   * @returns La barbería guardada, con el id que le asignó la base de datos.
   */
  guardar(barberia: BarberiaNueva): Promise<Barberia>

  /**
   * Busca una barbería por su identificador.
   *
   * @param id Identificador de la barbería.
   * @returns La barbería, o `null` si no existe.
   */
  porId(id: string): Promise<Barberia | null>

  /**
   * Busca una barbería por su correo, la llave natural con la que se detecta un registro repetido.
   *
   * @param correo Correo ya normalizado en minúsculas.
   * @returns La barbería, o `null` si ninguna usa ese correo.
   */
  porCorreo(correo: string): Promise<Barberia | null>

  /**
   * Catálogo público (CAR-07): solo las barberías habilitadas, ordenadas por nombre.
   *
   * @param ciudad Ciudad por la que filtrar, o `null` para no filtrar.
   * @returns Las barberías habilitadas; una lista vacía si no hay ninguna.
   */
  habilitadas(ciudad: string | null): Promise<Barberia[]>

  /**
   * Cambia el estado de una barbería. Qué transiciones están permitidas lo decide el caso de uso,
   * no el DAO.
   *
   * @param id Identificador de una barbería que ya existe (el caso de uso lo comprueba antes).
   * @param estado Estado de destino.
   * @param motivoSuspension Motivo si el destino es SUSPENDIDA; `null` en cualquier otro caso.
   * @returns La barbería con el estado nuevo.
   */
  cambiarEstado(id: string, estado: EstadoBarberia, motivoSuspension: string | null): Promise<Barberia>
}

/**
 * Acceso a datos del catálogo de servicios. Lo declara el dominio y lo implementa la
 * infraestructura (`ServicioDAOPrisma`); las pruebas usan un doble en memoria.
 *
 * `Catalogo` no es una entidad: es la consulta `activosDe`.
 */
export interface ServicioDAO {
  /**
   * Persiste un servicio nuevo.
   *
   * @param servicio Datos completos, sin id.
   * @returns El servicio guardado, con el id que le asignó la base de datos.
   */
  guardar(servicio: ServicioNuevo): Promise<Servicio>

  /**
   * Busca un servicio por su nombre dentro de una barbería. El nombre es único dentro de la
   * barbería y se compara sin distinguir mayúsculas.
   *
   * @param barberiaId Barbería dueña del catálogo.
   * @param nombre Nombre a buscar, sin espacios en los extremos.
   * @returns El servicio, o `null` si la barbería no tiene uno con ese nombre.
   */
  porNombre(barberiaId: string, nombre: string): Promise<Servicio | null>

  /**
   * Catálogo vigente de una barbería: solo los servicios activos, ordenados por nombre.
   *
   * @param barberiaId Barbería dueña del catálogo.
   * @returns Los servicios activos; una lista vacía si no tiene ninguno.
   */
  activosDe(barberiaId: string): Promise<Servicio[]>
}
