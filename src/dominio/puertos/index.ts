// Puertos: lo que el dominio necesita del exterior, en su propio vocabulario.
//
// - `...DAO`: acceso a datos, quien sepa guardar y recuperar entidades.
// - `...DTO`: estructura de datos que cruza una frontera.
// - Sin sufijo: contratos de comportamiento, que no son ni datos ni persistencia.

import type { Barberia, BarberiaNueva, EstadoBarberia, PerfilBarberia } from '../modelo/Barberia'
import type { HorarioAtencion, HorarioAtencionNuevo } from '../modelo/HorarioAtencion'
import type { Jornada, JornadaNueva } from '../modelo/Jornada'
import type { CambiosServicio, Servicio, ServicioNuevo } from '../modelo/Servicio'
import type { Usuario, UsuarioNuevo } from '../modelo/Usuario'

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
   * Bandeja del operador (CAR-19): las barberías en un estado dado, ordenadas por nombre.
   *
   * @param estado Estado por el que filtrar.
   * @returns Las barberías en ese estado; una lista vacía si no hay ninguna.
   */
  porEstado(estado: EstadoBarberia): Promise<Barberia[]>

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

  /**
   * Reemplaza los datos del perfil de una barbería. No toca el estado ni el motivo de suspensión:
   * esos solo cambian con `cambiarEstado`.
   *
   * @param id Identificador de una barbería que ya existe (el caso de uso lo comprueba antes).
   * @param perfil Datos del perfil, ya normalizados.
   * @returns La barbería con el perfil nuevo.
   */
  actualizarPerfil(id: string, perfil: PerfilBarberia): Promise<Barberia>
}

/**
 * Acceso a datos del horario de atención. Lo declara el dominio y lo implementa la
 * infraestructura (`HorarioAtencionDAOPrisma`); las pruebas usan un doble en memoria.
 */
export interface HorarioAtencionDAO {
  /**
   * Persiste un renglón del horario: una franja semanal recurrente o un cierre puntual.
   *
   * @param horario Datos completos, sin id.
   * @returns El renglón guardado, con el id que le asignó la base de datos.
   */
  guardar(horario: HorarioAtencionNuevo): Promise<HorarioAtencion>

  /**
   * Horario completo de una barbería: sus franjas semanales y sus cierres puntuales.
   *
   * @param barberiaId Barbería dueña del horario.
   * @returns Los renglones del horario; una lista vacía si no tiene ninguno.
   */
  deBarberia(barberiaId: string): Promise<HorarioAtencion[]>

  /**
   * Reemplaza el horario completo de una barbería en una sola operación atómica: borra sus
   * renglones y guarda los nuevos. Si algo falla, el horario anterior queda intacto.
   *
   * @param barberiaId Barbería dueña del horario.
   * @param renglones Franjas semanales y cierres puntuales nuevos, todos de esa barbería.
   * @returns Los renglones guardados, con los ids que les asignó la base de datos.
   */
  reemplazar(barberiaId: string, renglones: HorarioAtencionNuevo[]): Promise<HorarioAtencion[]>
}

/**
 * Acceso a datos de las jornadas de los barberos. Lo declara el dominio y lo implementa la
 * infraestructura (`JornadaDAOPrisma`); las pruebas usan un doble en memoria.
 *
 * Filtra por barbero, no por barbería: quien lo usa comprueba antes que el barbero sea de la barbería
 * de la URL (RES-02, `esBarberoDe`).
 */
export interface JornadaDAO {
  /**
   * Jornada completa de un barbero.
   *
   * @param barberoId Barbero dueño de la jornada.
   * @returns Sus franjas, en cualquier orden; una lista vacía si todavía no tiene jornada.
   */
  deBarbero(barberoId: string): Promise<Jornada[]>

  /**
   * Reemplaza la jornada completa de un barbero en una sola operación atómica: borra sus franjas y
   * guarda las nuevas. Si algo falla, la jornada anterior queda intacta.
   *
   * @param barberoId Barbero dueño de la jornada.
   * @param franjas Franjas nuevas, todas de ese barbero.
   * @returns Las franjas guardadas, con los ids que les asignó la base de datos.
   */
  reemplazar(barberoId: string, franjas: JornadaNueva[]): Promise<Jornada[]>
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
   * Busca un servicio dentro de una barbería. Si el servicio existe pero es de otra barbería, no
   * lo encuentra: el aislamiento multiempresa (RES-02) se aplica en la propia consulta.
   *
   * @param barberiaId Barbería dueña del catálogo.
   * @param id Identificador del servicio.
   * @returns El servicio, o `null` si esa barbería no tiene un servicio con ese id.
   */
  porId(barberiaId: string, id: string): Promise<Servicio | null>

  /**
   * Activa o desactiva un servicio. Un servicio se desactiva, nunca se borra (CAR-03). Si la
   * transición está permitida lo decide el caso de uso, no el DAO.
   *
   * @param id Identificador de un servicio que ya existe (el caso de uso lo comprueba antes).
   * @param activo `true` para volver a ofrecerlo; `false` para retirarlo de la vitrina.
   * @returns El servicio con el estado nuevo.
   */
  cambiarEstado(id: string, activo: boolean): Promise<Servicio>

  /**
   * Actualiza los campos editables, solo si el servicio pertenece a la barbería indicada (RES-02).
   *
   * @param id Identificador del servicio.
   * @param barberiaId Barbería dueña del catálogo.
   * @param cambios Nombre, precio y duración; la descripción solo si no es `null` (D-05).
   * @returns El servicio actualizado, o `null` si esa barbería no tiene un servicio con ese id.
   */
  actualizar(id: string, barberiaId: string, cambios: CambiosServicio): Promise<Servicio | null>

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

  /**
   * Catálogo de gestión de una barbería (CAR-03): todos sus servicios, activos e inactivos,
   * ordenados por nombre. El administrador ve también lo que retiró de la vitrina.
   *
   * @param barberiaId Barbería dueña del catálogo.
   * @returns Todos los servicios de la barbería; una lista vacía si no tiene ninguno.
   */
  deBarberia(barberiaId: string): Promise<Servicio[]>
}

/**
 * Acceso a datos de las cuentas de usuario. Lo declara el dominio y lo implementa la
 * infraestructura (`UsuarioDAOPrisma`); las pruebas usan un doble en memoria.
 *
 * El DAO guarda y devuelve el hash de la clave tal cual: calcularlo y compararlo no es su trabajo.
 */
export interface UsuarioDAO {
  /**
   * Persiste un usuario nuevo.
   *
   * @param usuario Datos completos, sin id, con la clave ya convertida en hash.
   * @returns El usuario guardado, con el id que le asignó la base de datos.
   */
  guardar(usuario: UsuarioNuevo): Promise<Usuario>

  /**
   * Busca un usuario por su identificador.
   *
   * @param id Identificador del usuario.
   * @returns El usuario, o `null` si no existe.
   */
  porId(id: string): Promise<Usuario | null>

  /**
   * Busca un usuario por su correo, la llave con la que inicia sesión y con la que se detecta un
   * registro repetido.
   *
   * @param correo Correo ya normalizado en minúsculas.
   * @returns El usuario, o `null` si ninguno usa ese correo.
   */
  porCorreo(correo: string): Promise<Usuario | null>
}
