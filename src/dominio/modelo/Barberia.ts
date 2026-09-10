/**
 * Estados posibles de una barbería dentro de la plataforma (CAR-02). Es la única fuente de
 * verdad: de aquí salen el tipo `EstadoBarberia`, la validación de datos externos y el `enum`
 * del contrato OpenAPI.
 *
 * Una barbería nace en PENDIENTE_VERIFICACION. El operador la pasa a HABILITADA y puede
 * suspenderla (SUSPENDIDA) o volver a habilitarla.
 */
export const ESTADOS_BARBERIA = ['PENDIENTE_VERIFICACION', 'HABILITADA', 'SUSPENDIDA'] as const

/** Estado de una barbería. Solo una HABILITADA es visible y recibe reservas (RES-11). */
export type EstadoBarberia = (typeof ESTADOS_BARBERIA)[number]

/**
 * Entidad del dominio. Sin sufijo: no es un dato en tránsito ni un acceso a datos.
 * Una barbería es una sola sede (SUP-03) y la unidad de aislamiento de los datos.
 */
export interface Barberia {
  /** Identificador UUID, asignado por la base de datos al guardar. */
  id: string
  /** Nombre comercial que ven los clientes. */
  nombre: string
  /** Presentación libre del negocio; puede ir vacía. */
  descripcion: string
  /** Dirección de la única sede (SUP-03). */
  direccion: string
  /** Ciudad de la sede; permite filtrar el catálogo público. */
  ciudad: string
  /** Teléfono de contacto, guardado sin separadores. */
  telefono: string
  /** Correo de contacto, en minúsculas. Es único: identifica a la barbería en el registro. */
  correo: string
  /** Momento del ciclo de vida en que está la barbería. */
  estado: EstadoBarberia
  /** Razón de la suspensión, registrada por el operador. `null` si no está suspendida. */
  motivoSuspension: string | null
}

/** Una barbería que todavía no existe: el DAO asigna el id al guardarla. */
export type BarberiaNueva = Omit<Barberia, 'id'>

/** Lo que sale hacia el exterior: la misma barbería, nunca el motivo interno de una suspensión. */
export interface BarberiaDTO {
  id: string
  nombre: string
  descripcion: string
  direccion: string
  ciudad: string
  telefono: string
  correo: string
  estado: EstadoBarberia
}

/**
 * Guarda de tipo para texto que llega de afuera: el cuerpo de una petición o una columna de la
 * base de datos, que en SQL Server no puede ser un `enum`.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es exactamente uno de los estados de `ESTADOS_BARBERIA`.
 */
export function esEstadoBarberia(valor: unknown): valor is EstadoBarberia {
  return ESTADOS_BARBERIA.includes(valor as EstadoBarberia)
}

/**
 * Regla RES-11: solo una barbería habilitada es visible para los clientes y recibe reservas.
 *
 * @param barberia Barbería a consultar.
 * @returns `true` si está en estado HABILITADA.
 */
export function esVisibleParaClientes(barberia: Barberia): boolean {
  return barberia.estado === 'HABILITADA'
}

/**
 * Quita espacios, guiones, puntos y paréntesis: "(606) 887-1234" y "6068871234" son el mismo
 * teléfono. Conserva el `+` del prefijo internacional.
 *
 * @param telefono Teléfono tal como lo escribió el usuario.
 * @returns El teléfono sin separadores.
 */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[\s()\-.]/g, '')
}

/**
 * Única puerta de salida de una barbería hacia el exterior: todo lo que responde la API pasa por
 * aquí, así que el motivo de una suspensión no puede filtrarse por descuido.
 *
 * @param barberia Entidad del dominio.
 * @returns La barbería sin `motivoSuspension`.
 */
export function aBarberiaDTO({ id, nombre, descripcion, direccion, ciudad, telefono, correo, estado }: Barberia): BarberiaDTO {
  return { id, nombre, descripcion, direccion, ciudad, telefono, correo, estado }
}
