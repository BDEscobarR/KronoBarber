/** Franja de atención recurrente para un día de la semana (0 domingo, 6 sábado). */
export interface FranjaAtencion {
  diaSemana: number
  horaInicio: string
  horaFin: string
}

/** Configuración completa de atención de una barbería. Los cierres son fechas locales YYYY-MM-DD. */
export interface HorarioAtencion {
  barberiaId: string
  franjas: FranjaAtencion[]
  cierres: string[]
}

/** Convierte una hora HH:mm a minutos desde medianoche, o null si el formato es incorrecto. */
export function minutosDesdeMedianoche(hora: string): number | null {
  const partes = /^(\d{2}):(\d{2})$/.exec(hora)
  if (!partes) return null
  const horas = Number(partes[1])
  const minutos = Number(partes[2])
  return horas <= 23 && minutos <= 59 ? horas * 60 + minutos : null
}

/** Dos franjas se solapan si comparten día y sus intervalos se intersectan. */
export function seSolapan(a: FranjaAtencion, b: FranjaAtencion): boolean {
  if (a.diaSemana !== b.diaSemana) return false
  const inicioA = minutosDesdeMedianoche(a.horaInicio)
  const finA = minutosDesdeMedianoche(a.horaFin)
  const inicioB = minutosDesdeMedianoche(b.horaInicio)
  const finB = minutosDesdeMedianoche(b.horaFin)
  if (inicioA === null || finA === null || inicioB === null || finB === null) return false
  return inicioA < finB && inicioB < finA
}
