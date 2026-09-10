export const ESTADOS_BARBERIA = ['PENDIENTE_VERIFICACION', 'HABILITADA', 'SUSPENDIDA'] as const

export type EstadoBarberia = (typeof ESTADOS_BARBERIA)[number]

/**
 * Entidad del dominio. Sin sufijo: no es un dato en tránsito ni un acceso a datos.
 * Una barbería es una sola sede (SUP-03) y la unidad de aislamiento de los datos.
 */
export interface Barberia {
  id: string
  nombre: string
  descripcion: string
  direccion: string
  ciudad: string
  telefono: string
  correo: string
  estado: EstadoBarberia
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

export function esEstadoBarberia(valor: unknown): valor is EstadoBarberia {
  return ESTADOS_BARBERIA.includes(valor as EstadoBarberia)
}

/** RES-11: solo una barbería habilitada es visible para los clientes y recibe reservas. */
export function esVisibleParaClientes(barberia: Barberia): boolean {
  return barberia.estado === 'HABILITADA'
}

/** «(606) 887-1234» y «6068871234» son el mismo teléfono: se guarda sin separadores. */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[\s()\-.]/g, '')
}

export function aBarberiaDTO({ id, nombre, descripcion, direccion, ciudad, telefono, correo, estado }: Barberia): BarberiaDTO {
  return { id, nombre, descripcion, direccion, ciudad, telefono, correo, estado }
}
