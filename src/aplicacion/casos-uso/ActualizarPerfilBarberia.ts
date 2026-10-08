import { normalizarTelefono, type Barberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'
import { BarberiaNoEncontrada } from './HabilitarBarberia'
import { CorreoDeBarberiaYaRegistrado } from './RegistrarBarberia'

/**
 * Error de negocio: la barbería está suspendida y su perfil no se puede modificar hasta que el
 * operador la vuelva a habilitar. La ruta HTTP lo traduce a 409.
 */
export class BarberiaSuspendida extends Error {
  /** @param id Identificador de la barbería. */
  constructor(id: string) {
    super(`La barbería ${id} está suspendida: su perfil no se puede modificar`)
  }
}

/** Datos de entrada de la actualización del perfil, ya validados en la frontera HTTP. */
export interface ActualizacionPerfilBarberiaDTO {
  id: string
  nombre: string
  descripcion: string
  direccion: string
  ciudad: string
  telefono: string
  correo: string
}

/**
 * Caso de uso: el administrador actualiza el perfil de su barbería, es decir, nombre, ubicación,
 * contacto y descripción (CAR-01).
 *
 * Solo cambia el perfil. El estado es del operador (CAR-02): actualizar no devuelve una barbería
 * habilitada a verificación ni rehabilita una suspendida.
 */
export class ActualizarPerfilBarberia {
  /** @param barberias Acceso a datos de las barberías. */
  constructor(private readonly barberias: BarberiaDAO) {}

  /**
   * Normaliza los datos igual que el registro y reemplaza el perfil de la barbería.
   *
   * @param datos Perfil completo e id de la barbería, ya validados en la frontera HTTP.
   * @returns La barbería con el perfil nuevo y el mismo estado.
   * @throws {BarberiaNoEncontrada} Si no existe una barbería con ese id.
   * @throws {BarberiaSuspendida} Si la barbería está suspendida.
   * @throws {CorreoDeBarberiaYaRegistrado} Si otra barbería ya usa ese correo, sin distinguir mayúsculas.
   */
  async ejecutar(datos: ActualizacionPerfilBarberiaDTO): Promise<Barberia> {
    const barberia = await this.barberias.porId(datos.id)
    if (!barberia) throw new BarberiaNoEncontrada(datos.id)
    // Suspendida, la barbería queda en manos del operador: su perfil no cambia hasta que la
    // rehabilite. Pendiente o habilitada, sí se puede editar.
    if (barberia.estado === 'SUSPENDIDA') throw new BarberiaSuspendida(datos.id)

    // El correo es la llave natural del registro: puede cambiar, pero no a uno que ya usa otra
    // barbería. Conservar el propio no es un choque.
    const correo = datos.correo.trim().toLowerCase()
    const duena = await this.barberias.porCorreo(correo)
    if (duena && duena.id !== datos.id) throw new CorreoDeBarberiaYaRegistrado(correo)

    return this.barberias.actualizarPerfil(datos.id, {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      direccion: datos.direccion.trim(),
      ciudad: datos.ciudad.trim(),
      telefono: normalizarTelefono(datos.telefono),
      correo,
    })
  }
}
