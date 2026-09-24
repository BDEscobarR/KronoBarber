/**
 * Roles de la plataforma (README §2, CAR-17). Es la única fuente de verdad: de aquí salen el tipo
 * `RolUsuario`, la validación de datos externos y el `enum` del contrato OpenAPI.
 *
 * OPERADOR y CLIENTE no pertenecen a ninguna barbería; ADMINISTRADOR y BARBERO pertenecen a una.
 */
export const ROLES_USUARIO = ['OPERADOR', 'ADMINISTRADOR', 'BARBERO', 'CLIENTE'] as const

/** Rol de un usuario. Decide qué operaciones puede hacer y sobre qué datos (RES-02). */
export type RolUsuario = (typeof ROLES_USUARIO)[number]

/** Roles que trabajan dentro de una barbería y, por eso, solo ven los datos de esa barbería. */
const ROLES_DE_BARBERIA: readonly RolUsuario[] = ['ADMINISTRADOR', 'BARBERO']

/**
 * Entidad del dominio: una cuenta propia con la que alguien entra a la plataforma (CAR-17).
 * Una cuenta se desactiva, no se borra: su historial (turnos, cierres, aprobaciones) la referencia.
 */
export interface Usuario {
  /** Identificador UUID, asignado por la base de datos al guardar. */
  id: string
  /** Nombre de la persona, tal como se muestra en la agenda y en los comprobantes. */
  nombre: string
  /** Correo en minúsculas. Es único: con él se inicia sesión. */
  correo: string
  /** Hash de la clave. La clave en claro nunca llega al dominio ni a la base de datos (RES-13). */
  claveHash: string
  /** Qué puede hacer el usuario en la plataforma. */
  rol: RolUsuario
  /**
   * Barbería a la que pertenece: la llave del aislamiento multiempresa (RES-02). Obligatoria para
   * ADMINISTRADOR y BARBERO; `null` para OPERADOR y CLIENTE (ver `perteneceABarberia`).
   */
  barberiaId: string | null
  /** `false` si la cuenta fue desactivada: no puede iniciar sesión. */
  activo: boolean
}

/** Un usuario que todavía no existe: el DAO asigna el id al guardarlo. */
export type UsuarioNuevo = Omit<Usuario, 'id'>

/** Lo que sale hacia el exterior: el mismo usuario, nunca el hash de su clave. */
export interface UsuarioDTO {
  id: string
  nombre: string
  correo: string
  rol: RolUsuario
  barberiaId: string | null
  activo: boolean
}

/**
 * Guarda de tipo para texto que llega de afuera: el cuerpo de una petición o una columna de la
 * base de datos, que en SQL Server no puede ser un `enum`.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es exactamente uno de los roles de `ROLES_USUARIO`.
 */
export function esRolUsuario(valor: unknown): valor is RolUsuario {
  return ROLES_USUARIO.includes(valor as RolUsuario)
}

/**
 * Regla del aislamiento multiempresa (RES-02): ADMINISTRADOR y BARBERO trabajan dentro de una
 * barbería y deben tener `barberiaId`; OPERADOR (transversal) y CLIENTE no pertenecen a ninguna.
 *
 * @param rol Rol a consultar.
 * @returns `true` si un usuario con ese rol debe estar vinculado a una barbería.
 */
export function perteneceABarberia(rol: RolUsuario): boolean {
  return ROLES_DE_BARBERIA.includes(rol)
}

/**
 * Única puerta de salida de un usuario hacia el exterior: todo lo que responde la API pasa por
 * aquí, así que el hash de la clave no puede filtrarse por descuido.
 *
 * @param usuario Entidad del dominio.
 * @returns El usuario sin `claveHash`.
 */
export function aUsuarioDTO({ id, nombre, correo, rol, barberiaId, activo }: Usuario): UsuarioDTO {
  return { id, nombre, correo, rol, barberiaId, activo }
}
