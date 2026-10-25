import { DIAS_SEMANA, type DiaSemana, type Franja, type FranjaSemanal } from './HorarioAtencion'

/**
 * Entidad del dominio: un renglón de la jornada de **un** barbero (CAR-06), es decir, una franja
 * semanal en la que atiende. Varias el mismo día son una jornada partida. Siempre queda dentro del
 * horario de atención de su barbería (regla 4, RES-07).
 *
 * La define el barbero, pero la registra y la modifica solo el administrador de su barbería (D-16).
 * No existe la entidad `Barbero`: `barberoId` es el id de un `Usuario` con rol BARBERO.
 */
export interface Jornada {
  /** Identificador UUID, asignado por la base de datos al guardar. */
  id: string
  /** Barbero dueño de la jornada: un `Usuario` con rol BARBERO. */
  barberoId: string
  /** Día de la semana de la franja. */
  diaSemana: DiaSemana
  /** Horario en que el barbero atiende ese día. */
  franja: Franja
}

/** Un renglón de jornada que todavía no existe: el DAO asigna el id al guardarlo. */
export type JornadaNueva = Omit<Jornada, 'id'>

/** Lo que sale hacia el exterior: la jornada completa de un barbero, tal como la registra el administrador. */
export interface JornadaDTO {
  barberoId: string
  /** Franjas semanales, por día y hora; varias el mismo día son una jornada partida. */
  franjas: FranjaSemanal[]
}

/**
 * Agrupa los renglones guardados en la forma en que los registra el administrador, ordenados de lunes
 * a domingo y por hora de inicio: la base de datos no garantiza ningún orden.
 *
 * @param barberoId Barbero dueño de la jornada.
 * @param renglones Franjas de la jornada, en cualquier orden.
 * @returns La jornada completa del barbero.
 */
export function aJornadaDTO(barberoId: string, renglones: Jornada[]): JornadaDTO {
  const franjas = renglones
    .map(({ diaSemana, franja }) => ({ diaSemana, ...franja }))
    .sort(
      (a, b) =>
        DIAS_SEMANA.indexOf(a.diaSemana) - DIAS_SEMANA.indexOf(b.diaSemana) || a.inicio.localeCompare(b.inicio),
    )
  return { barberoId, franjas }
}
