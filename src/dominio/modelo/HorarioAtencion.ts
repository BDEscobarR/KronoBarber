/**
 * Días de la semana de una franja recurrente (README §3, CAR-05). Es la única fuente de verdad:
 * de aquí sale el tipo `DiaSemana` y la validación de datos externos.
 */
export const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const

/** Día de la semana de una franja recurrente. */
export type DiaSemana = (typeof DIAS_SEMANA)[number]

/** Hora del día en formato `HH:MM`, de `00:00` a `23:59`. */
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

/** Fecha de calendario en formato `YYYY-MM-DD`, con año, mes y día capturados. */
const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Intervalo de tiempo dentro de un mismo día. `inicio` cuenta como ocupado, `fin` no: dos franjas
 * contiguas (el fin de una es el inicio de la otra) no se solapan.
 */
export interface Franja {
  /** Hora de apertura, en formato `HH:MM`. */
  inicio: string
  /** Hora de cierre, en formato `HH:MM`. Posterior a `inicio`. */
  fin: string
}

/**
 * Entidad del dominio: un renglón del horario de atención de **una** barbería (CAR-05), el límite
 * exterior de toda disponibilidad (regla 4, RES-07) — ninguna `Jornada` de barbero podrá excederlo.
 *
 * Es uno de dos tipos de renglón, según qué campo traiga:
 * - **Franja semanal recurrente**: `diaSemana` y `franja` presentes, `fecha` en `null`.
 * - **Cierre puntual** (un feriado, por ejemplo): `fecha` presente, `diaSemana` y `franja` en
 *   `null`. Ese día la barbería no atiende, sin importar qué franja semanal le correspondería.
 *
 * Una barbería puede tener varias franjas para el mismo día (jornada partida: mañana y tarde).
 */
export interface HorarioAtencion {
  /** Identificador UUID, asignado por la base de datos al guardar. */
  id: string
  /** Barbería dueña del horario. */
  barberiaId: string
  /** Día de una franja semanal recurrente; `null` en un cierre puntual. */
  diaSemana: DiaSemana | null
  /** Fecha (`YYYY-MM-DD`) de un cierre puntual; `null` en una franja semanal. */
  fecha: string | null
  /** Horario de atención de la franja; `null` en un cierre puntual. */
  franja: Franja | null
}

/** Un horario que todavía no existe: el DAO asigna el id al guardarlo. */
export type HorarioAtencionNuevo = Omit<HorarioAtencion, 'id'>

/**
 * Guarda de tipo para texto que llega de afuera: el cuerpo de una petición o una columna de la
 * base de datos, que en SQL Server no puede ser un `enum`.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es exactamente uno de los días de `DIAS_SEMANA`.
 */
export function esDiaSemana(valor: unknown): valor is DiaSemana {
  return DIAS_SEMANA.includes(valor as DiaSemana)
}

/**
 * Igual que `esDiaSemana`, pero para la columna `diaSemana`, que es nula en un cierre puntual.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es `null` o uno de los días de `DIAS_SEMANA`.
 */
export function esDiaSemanaOpcional(valor: unknown): valor is DiaSemana | null {
  return valor === null || esDiaSemana(valor)
}

/**
 * Comprueba que un texto tenga la forma `HH:MM` de una hora válida.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es una hora entre `00:00` y `23:59`.
 */
export function esHoraValida(valor: unknown): valor is string {
  return typeof valor === 'string' && HORA.test(valor)
}

/**
 * Comprueba que un texto sea la fecha `YYYY-MM-DD` de un cierre puntual y que exista en el
 * calendario: `2026-02-30` tiene la forma, pero no existe. Es aritmética pura, sin `Date`.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es una fecha real en formato `YYYY-MM-DD`.
 */
export function esFechaValida(valor: unknown): valor is string {
  const partes = typeof valor === 'string' ? FECHA.exec(valor) : null
  if (!partes) return false
  const [anio, mes, dia] = partes.slice(1).map(Number) as [number, number, number]
  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0)
  const diasDelMes = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1]
  return diasDelMes !== undefined && dia >= 1 && dia <= diasDelMes
}

/**
 * Semilla de la regla 5 (CAR-13): ¿se solapan dos franjas del mismo día? El fin de una no cuenta
 * como solapado con el inicio de la siguiente, así que dos franjas contiguas no se pisan; una
 * franja parcialmente superpuesta o contenida en otra sí.
 *
 * @param a Primera franja.
 * @param b Segunda franja.
 * @returns `true` si algún instante pertenece a ambas franjas.
 */
export function seSolapan(a: Franja, b: Franja): boolean {
  return a.inicio < b.fin && b.inicio < a.fin
}
