import { normalizarTelefono, type Barberia } from '../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../dominio/puertos'
import { BarberiaNoEncontrada } from './HabilitarBarberia'
import { CorreoDeBarberiaYaRegistrado } from './RegistrarBarberia'

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
 * habilitada a verificación ni rehabilita una suspendida. Una barbería suspendida sí se puede editar,
 * para corregir lo que motivó la suspensión, pero sigue sin verse hasta que el operador la habilite (D-03).
 */
export class ActualizarPerfilBarberia {
  /** @param barberias Acceso a datos de las barberías. */
  constructor(private readonly barberias: BarberiaDAO) {}

  /**
   * Normaliza los datos igual que el registro y reemplaza el perfil de la barbería.
   *
   * @param datos Perfil completo e id de la barbería, ya validados en la frontera HTTP.
   * @returns La barbería con el perfil nuevo y el mismo estado (y, si está suspendida, el mismo motivo).
   * @throws {BarberiaNoEncontrada} Si no existe una barbería con ese id.
   * @throws {CorreoDeBarberiaYaRegistrado} Si otra barbería ya usa ese correo, sin distinguir mayúsculas.
   */
  async ejecutar(datos: ActualizacionPerfilBarberiaDTO): Promise<Barberia> {
    // Se edita en cualquier estado (D-03): RES-11 condiciona la visibilidad y las reservas, no la
    // configuración de la barbería.
    const barberia = await this.barberias.porId(datos.id)
    if (!barberia) throw new BarberiaNoEncontrada(datos.id)

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
