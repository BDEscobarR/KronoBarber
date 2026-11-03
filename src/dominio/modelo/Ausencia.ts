/**
 * Tipos de ausencia de un barbero (CAR-06, D-16). Es la única fuente de verdad: de aquí salen el tipo
 * `TipoAusencia`, la validación de datos externos y el `enum` del contrato OpenAPI.
 *
 * Los tres son tiempo en que el barbero no atiende: un día libre, un permiso o un bloqueo puntual de
 * un rato de su jornada. Solo cambia cómo lo nombra el administrador; los tres restan disponibilidad.
 */
export const TIPOS_AUSENCIA = ['DIA_LIBRE', 'PERMISO', 'BLOQUEO'] as const

/** Tipo de una ausencia. */
export type TipoAusencia = (typeof TIPOS_AUSENCIA)[number]

/**
 * Entidad del dominio: un intervalo en que un barbero no atiende (CAR-06). La registra el
 * administrador de su barbería, sin solicitud ni aprobación, y rige de inmediato (D-16): mientras no
 * esté anulada, resta disponibilidad (#37).
 *
 * No existe la entidad `Barbero`: `barberoId` es el id de un `Usuario` con rol BARBERO.
 */
export interface Ausencia {
  /** Identificador UUID, asignado por la base de datos al guardar. */
  id: string
  /** Barbero que no atiende: un `Usuario` con rol BARBERO. */
  barberoId: string
  /** Cómo la nombra el administrador. */
  tipo: TipoAusencia
  /** Instante en que empieza, en UTC (los instantes se persisten en UTC, §9). */
  desde: Date
  /** Instante en que termina, en UTC. Siempre posterior a `desde` (`terminaDespuesDeEmpezar`). */
  hasta: Date
  /** `true` si el administrador la anuló: deja de restar disponibilidad, pero no se borra. */
  anulada: boolean
}

/** Una ausencia que todavía no existe: el DAO asigna el id al guardarla. */
export type AusenciaNueva = Omit<Ausencia, 'id'>

/** Lo que el administrador puede modificar de una ausencia: su tipo y su intervalo. */
export type CambiosAusencia = Pick<Ausencia, 'tipo' | 'desde' | 'hasta'>

/**
 * Lo que sale hacia el exterior: la ausencia completa, que no tiene datos internos. Los instantes van
 * en UTC; la ruta HTTP los presenta en America/Bogotá, porque la conversión ocurre en el borde (§9).
 */
export interface AusenciaDTO {
  id: string
  barberoId: string
  tipo: TipoAusencia
  desde: Date
  hasta: Date
  anulada: boolean
}

/**
 * Guarda de tipo para texto que llega de afuera: el cuerpo de una petición o una columna de la base
 * de datos, que en SQL Server no puede ser un `enum`.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es exactamente uno de los tipos de `TIPOS_AUSENCIA`.
 */
export function esTipoAusencia(valor: unknown): valor is TipoAusencia {
  return TIPOS_AUSENCIA.includes(valor as TipoAusencia)
}

/**
 * Regla de la ausencia (criterio de #20): termina después de empezar. Un intervalo vacío o invertido
 * no retira ningún tiempo de la disponibilidad, así que no es una ausencia.
 *
 * @param intervalo Inicio y fin de la ausencia.
 * @returns `true` si `hasta` es posterior a `desde`.
 */
export function terminaDespuesDeEmpezar({ desde, hasta }: Pick<Ausencia, 'desde' | 'hasta'>): boolean {
  return hasta.getTime() > desde.getTime()
}

/**
 * Única puerta de salida de una ausencia hacia el exterior: todo lo que responde la API pasa por aquí.
 *
 * @param ausencia Entidad del dominio.
 * @returns El DTO de la ausencia.
 */
export function aAusenciaDTO({ id, barberoId, tipo, desde, hasta, anulada }: Ausencia): AusenciaDTO {
  return { id, barberoId, tipo, desde, hasta, anulada }
}
