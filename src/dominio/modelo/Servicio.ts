/** Rejilla de la agenda: toda duración es múltiplo de este paso, para que no queden huecos imposibles de reservar. */
export const PASO_DURACION_MINUTOS = 5
export const DURACION_MINIMA_MINUTOS = 5
/** Ocho horas: ningún servicio de barbería dura más que una jornada. */
export const DURACION_MAXIMA_MINUTOS = 480
/** Tope defensivo contra un error al teclear el precio. No es una regla del Documento de Visión. */
export const PRECIO_MAXIMO = 100_000_000

/**
 * Entidad del dominio: una prestación del catálogo de **una** barbería (CAR-03).
 * El precio va en pesos colombianos enteros (RES-06) y la duración en minutos.
 * Un servicio se desactiva, nunca se borra: los turnos que lo usaron son historial.
 */
export interface Servicio {
  id: string
  barberiaId: string
  nombre: string
  descripcion: string
  precio: number
  duracionMinutos: number
  activo: boolean
}

/** Un servicio que todavía no existe: el DAO asigna el id al guardarlo. */
export type ServicioNuevo = Omit<Servicio, 'id'>

/**
 * Lo que sale hacia el exterior. Hoy coincide campo a campo con la entidad; existe para
 * que un campo interno que mañana gane `Servicio` no se filtre por HTTP sin querer.
 */
export interface ServicioDTO {
  id: string
  barberiaId: string
  nombre: string
  descripcion: string
  precio: number
  duracionMinutos: number
  activo: boolean
}

/** Sobre el precio se calculará el anticipo del 20 % (RES-03): un precio cero no confirma nada. */
export function esPrecioValido(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0 && valor <= PRECIO_MAXIMO
}

/** La duración determina el tamaño del espacio libre que ve el cliente (CAR-09). */
export function esDuracionValida(valor: unknown): valor is number {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= DURACION_MINIMA_MINUTOS &&
    valor <= DURACION_MAXIMA_MINUTOS &&
    valor % PASO_DURACION_MINUTOS === 0
  )
}

export function aServicioDTO({ id, barberiaId, nombre, descripcion, precio, duracionMinutos, activo }: Servicio): ServicioDTO {
  return { id, barberiaId, nombre, descripcion, precio, duracionMinutos, activo }
}
