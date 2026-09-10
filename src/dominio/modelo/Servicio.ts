/** Rejilla de la agenda: toda duración es múltiplo de este paso, para que no queden huecos imposibles de reservar. */
export const PASO_DURACION_MINUTOS = 5
/** Duración mínima de un servicio: un solo paso de la rejilla. */
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
  /** Identificador UUID, asignado por la base de datos al guardar. */
  id: string
  /** Barbería dueña del servicio. No cambia nunca: es la clave del aislamiento multiempresa (RES-02). */
  barberiaId: string
  /** Nombre que ve el cliente en el catálogo; único dentro de la barbería. */
  nombre: string
  /** Detalle libre de lo que incluye; puede ir vacío. */
  descripcion: string
  /** Valor total en pesos colombianos enteros. Base del anticipo del 20 % (RES-03). */
  precio: number
  /** Duración estimada; determina el tamaño del turno en la agenda. */
  duracionMinutos: number
  /** `false` si el administrador lo retiró del catálogo. */
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

/**
 * Comprueba que un precio sea cobrable: pesos enteros (RES-06), mayor que cero porque sobre él
 * se calculará el anticipo del 20 % (RES-03), y sin pasar de `PRECIO_MAXIMO`.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es un entero entre 1 y `PRECIO_MAXIMO`.
 */
export function esPrecioValido(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0 && valor <= PRECIO_MAXIMO
}

/**
 * Comprueba que una duración encaje en la agenda. La duración determina el tamaño del espacio
 * libre que ve el cliente (CAR-09), así que debe caer en la rejilla de `PASO_DURACION_MINUTOS`.
 *
 * @param valor Dato de origen desconocido.
 * @returns `true` si `valor` es un entero de minutos entre `DURACION_MINIMA_MINUTOS` y
 *   `DURACION_MAXIMA_MINUTOS`, múltiplo de `PASO_DURACION_MINUTOS`.
 */
export function esDuracionValida(valor: unknown): valor is number {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= DURACION_MINIMA_MINUTOS &&
    valor <= DURACION_MAXIMA_MINUTOS &&
    valor % PASO_DURACION_MINUTOS === 0
  )
}

/**
 * Única puerta de salida de un servicio hacia el exterior: todo lo que responde la API pasa por
 * aquí, campo a campo.
 *
 * @param servicio Entidad del dominio.
 * @returns El servicio tal como viaja por HTTP.
 */
export function aServicioDTO({ id, barberiaId, nombre, descripcion, precio, duracionMinutos, activo }: Servicio): ServicioDTO {
  return { id, barberiaId, nombre, descripcion, precio, duracionMinutos, activo }
}
