import { Router } from 'express'
import { aAusenciaDTO, esTipoAusencia, TIPOS_AUSENCIA, type AusenciaDTO } from '../../../dominio/modelo/Ausencia'
import { esFechaValida, esHoraValida } from '../../../dominio/modelo/HorarioAtencion'
import { aJornadaDTO } from '../../../dominio/modelo/Jornada'
import { esBarberoDe } from '../../../dominio/modelo/Usuario'
import type { AusenciaDAO, JornadaDAO, UsuarioDAO } from '../../../dominio/puertos'
import type { AnularAusencia } from '../../../aplicacion/casos-uso/AnularAusencia'
import { BarberiaNoEncontrada } from '../../../aplicacion/casos-uso/HabilitarBarberia'
import {
  BarberoDesvinculado,
  BarberoNoEncontrado,
  JornadaFueraDeHorario,
  JornadaInvalida,
  type DefinicionJornadaDTO,
  type DefinirJornada,
} from '../../../aplicacion/casos-uso/DefinirJornada'
import {
  AusenciaAnulada,
  AusenciaNoEncontrada,
  type ModificarAusencia,
} from '../../../aplicacion/casos-uso/ModificarAusencia'
import {
  AusenciaInvalida,
  type RegistrarAusencia,
  type RegistroAusenciaDTO,
} from '../../../aplicacion/casos-uso/RegistrarAusencia'
import { validarFranjas } from './barberias'

/**
 * Validación de frontera de la jornada: la forma de cada franja, igual que en el horario de atención.
 * Que sean coherentes entre sí y quepan en el horario lo comprueba `DefinirJornada`.
 *
 * @param barberiaId Barbería tomada de la URL.
 * @param barberoId Barbero tomado de la URL.
 * @param cuerpo Cuerpo de la petición, sin validar.
 * @returns Los datos listos para `DefinirJornada`, o el mensaje de error para responder un 400.
 */
function validarJornada(barberiaId: string, barberoId: string, cuerpo: unknown): DefinicionJornadaDTO | string {
  const franjas = validarFranjas(((cuerpo ?? {}) as Record<string, unknown>)['franjas'])
  return typeof franjas === 'string' ? franjas : { barberiaId, barberoId, franjas }
}

/**
 * Instante ISO 8601 con la zona explícita: `Z` o un desfase `±HH:MM`. Sin zona, `2026-11-10T08:00`
 * sería ambiguo entre la hora de Bogotá y la UTC, así que se rechaza. Los segundos son opcionales y
 * pueden traer fracción, como admite `format: date-time` (RFC 3339): `2026-11-10T19:00:00.000Z` es
 * como JSON serializa una fecha (corrección de #20).
 */
const INSTANTE = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/

/**
 * Lee un instante que llega de afuera. La fecha y la hora se comprueban con las guardas del dominio
 * antes de pasar por `Date`, porque `Date` no rechaza `2026-02-30`: lo corre al 2 de marzo.
 *
 * @param valor Dato de origen desconocido.
 * @param campo Nombre del campo, para el mensaje del 400.
 * @returns El instante, o el mensaje de error.
 */
function leerInstante(valor: unknown, campo: string): Date | string {
  const partes = typeof valor === 'string' ? INSTANTE.exec(valor) : null
  if (!partes || !esFechaValida(partes[1]) || !esHoraValida(partes[2]))
    return `${campo} debe ser una fecha y hora ISO 8601 con zona, como 2026-11-10T08:00:00-05:00`
  return new Date(partes[0])
}

/**
 * Validación de frontera de una ausencia: el tipo y los dos instantes. Que termine después de empezar
 * y sea de un barbero activo de esa barbería lo comprueba el caso de uso.
 *
 * @param barberiaId Barbería tomada de la URL.
 * @param barberoId Barbero tomado de la URL.
 * @param cuerpo Cuerpo de la petición, sin validar.
 * @returns Los datos listos para `RegistrarAusencia` o `ModificarAusencia`, o el mensaje del 400.
 */
export function validarAusencia(barberiaId: string, barberoId: string, cuerpo: unknown): RegistroAusenciaDTO | string {
  const { tipo, desde, hasta } = (cuerpo ?? {}) as Record<string, unknown>
  if (!esTipoAusencia(tipo)) return `tipo inválido (${TIPOS_AUSENCIA.join(', ')})`
  const inicio = leerInstante(desde, 'desde')
  if (typeof inicio === 'string') return inicio
  const fin = leerInstante(hasta, 'hasta')
  if (typeof fin === 'string') return fin
  return { barberiaId, barberoId, tipo, desde: inicio, hasta: fin }
}

/** America/Bogotá está en UTC−5 todo el año: no tiene horario de verano. */
const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000

/**
 * Presenta un instante en la hora de America/Bogotá, con su desfase explícito (regla 10, DEP-02). La
 * conversión ocurre aquí, en el borde HTTP: el dominio y la base de datos trabajan en UTC (§9).
 *
 * @param instante Instante en UTC.
 * @returns El instante como `YYYY-MM-DDTHH:MM:SS-05:00`; la fracción de segundo no se presenta.
 */
export function enBogota(instante: Date): string {
  return `${new Date(instante.getTime() + DESFASE_BOGOTA_MS).toISOString().slice(0, 19)}-05:00`
}

/**
 * Lo que responde la API por una ausencia: el DTO, con los instantes en la hora de Bogotá.
 *
 * @param ausencia DTO de la ausencia, con los instantes en UTC.
 * @returns El cuerpo JSON de la respuesta.
 */
const aRespuesta = (ausencia: AusenciaDTO) => ({ ...ausencia, desde: enBogota(ausencia.desde), hasta: enBogota(ausencia.hasta) })

/** Lo que necesitan las rutas del personal; `main.ts` lo arma con implementaciones concretas. */
export interface DependenciasBarberos {
  /** Caso de uso de la jornada del barbero (CAR-06, D-16). */
  definirJornada: DefinirJornada
  /** Casos de uso de las ausencias del barbero (CAR-06, D-16). */
  registrarAusencia: RegistrarAusencia
  modificarAusencia: ModificarAusencia
  anularAusencia: AnularAusencia
  /** Acceso a las cuentas, para comprobar que el barbero es de la barbería de la URL (RES-02). */
  usuarios: UsuarioDAO
  /** Acceso directo a las jornadas para consultarlas. */
  jornadas: JornadaDAO
  /** Acceso directo a las ausencias para consultarlas. */
  ausencias: AusenciaDAO
}

/**
 * Rutas del personal de una barbería, montadas en `/api/barberias`. Los barberos cuelgan de su
 * barbería en la URL, igual que los servicios:
 *
 * - `PUT /:barberiaId/barberos/:barberoId/jornada`: reemplaza la jornada del barbero. Responde 200,
 *   400, 404 o 409.
 * - `GET /:barberiaId/barberos/:barberoId/jornada`: la jornada registrada. Responde 200 o 404.
 * - `POST /:barberiaId/barberos/:barberoId/ausencias`: registra una ausencia. Responde 201, 400, 404
 *   o 409.
 * - `GET /:barberiaId/barberos/:barberoId/ausencias`: las ausencias del barbero, también las anuladas.
 *   Responde 200 o 404.
 * - `PUT /:barberiaId/barberos/:barberoId/ausencias/:ausenciaId`: modifica una ausencia. Responde 200,
 *   400, 404 o 409.
 * - `POST /:barberiaId/barberos/:barberoId/ausencias/:ausenciaId/anulacion`: la anula, sin cuerpo.
 *   Responde 200, 404 o 409.
 *
 * @param deps Casos de uso y DAO que usan los handlers.
 * @returns El router de Express.
 */
export function rutasBarberos(deps: DependenciasBarberos): Router {
  const rutas = Router()

  // La jornada la registra el administrador, no el barbero (D-16). Hoy es abierta como el resto de la
  // API; exigir ADMINISTRADOR de esa barbería llega con la Fase 4 (#27).
  rutas.put('/:barberiaId/barberos/:barberoId/jornada', async (req, res, next) => {
    const datos = validarJornada(req.params.barberiaId, req.params.barberoId, req.body)
    if (typeof datos === 'string') return void res.status(400).json({ error: datos })
    try {
      res.json(await deps.definirJornada.ejecutar(datos))
    } catch (error) {
      if (error instanceof JornadaInvalida) return void res.status(400).json({ error: error.message })
      if (error instanceof BarberiaNoEncontrada || error instanceof BarberoNoEncontrado)
        return void res.status(404).json({ error: error.message })
      if (error instanceof BarberoDesvinculado || error instanceof JornadaFueraDeHorario)
        return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  // Consulta sin reglas propias más allá del aislamiento (RES-02): el barbero tiene que ser de la
  // barbería de la URL. Si lo es, la barbería existe. Un barbero desvinculado conserva su jornada en
  // el historial, así que también se puede consultar.
  rutas.get('/:barberiaId/barberos/:barberoId/jornada', async (req, res, next) => {
    try {
      const barbero = await deps.usuarios.porId(req.params.barberoId)
      if (!barbero || !esBarberoDe(barbero, req.params.barberiaId))
        return void res.status(404).json({ error: 'Barbero no encontrado en esta barbería' })
      res.json(aJornadaDTO(barbero.id, await deps.jornadas.deBarbero(barbero.id)))
    } catch (error) {
      next(error)
    }
  })

  // Las ausencias, como la jornada, las registra, modifica y anula el administrador, sin solicitud ni
  // aprobación (D-16). Hoy son abiertas; exigir ADMINISTRADOR de esa barbería llega con #27.
  rutas.post('/:barberiaId/barberos/:barberoId/ausencias', async (req, res, next) => {
    const datos = validarAusencia(req.params.barberiaId, req.params.barberoId, req.body)
    if (typeof datos === 'string') return void res.status(400).json({ error: datos })
    try {
      res.status(201).json(aRespuesta(await deps.registrarAusencia.ejecutar(datos)))
    } catch (error) {
      if (error instanceof AusenciaInvalida) return void res.status(400).json({ error: error.message })
      if (error instanceof BarberiaNoEncontrada || error instanceof BarberoNoEncontrado)
        return void res.status(404).json({ error: error.message })
      if (error instanceof BarberoDesvinculado) return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  // Igual que la jornada: basta el aislamiento (RES-02), y un barbero desvinculado conserva sus
  // ausencias en el historial. Las anuladas también salen, con `anulada: true`.
  rutas.get('/:barberiaId/barberos/:barberoId/ausencias', async (req, res, next) => {
    try {
      const barbero = await deps.usuarios.porId(req.params.barberoId)
      if (!barbero || !esBarberoDe(barbero, req.params.barberiaId))
        return void res.status(404).json({ error: 'Barbero no encontrado en esta barbería' })
      res.json((await deps.ausencias.deBarbero(barbero.id)).map((a) => aRespuesta(aAusenciaDTO(a))))
    } catch (error) {
      next(error)
    }
  })

  rutas.put('/:barberiaId/barberos/:barberoId/ausencias/:ausenciaId', async (req, res, next) => {
    const datos = validarAusencia(req.params.barberiaId, req.params.barberoId, req.body)
    if (typeof datos === 'string') return void res.status(400).json({ error: datos })
    try {
      res.json(aRespuesta(await deps.modificarAusencia.ejecutar({ ...datos, ausenciaId: req.params.ausenciaId })))
    } catch (error) {
      if (error instanceof AusenciaInvalida) return void res.status(400).json({ error: error.message })
      if (
        error instanceof BarberiaNoEncontrada ||
        error instanceof BarberoNoEncontrado ||
        error instanceof AusenciaNoEncontrada
      )
        return void res.status(404).json({ error: error.message })
      if (error instanceof BarberoDesvinculado || error instanceof AusenciaAnulada)
        return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  // Acción de estado sin cuerpo, como la desactivación de un servicio (D-04).
  rutas.post('/:barberiaId/barberos/:barberoId/ausencias/:ausenciaId/anulacion', async (req, res, next) => {
    try {
      const { barberiaId, barberoId, ausenciaId } = req.params
      res.json(aRespuesta(await deps.anularAusencia.ejecutar({ barberiaId, barberoId, ausenciaId })))
    } catch (error) {
      if (
        error instanceof BarberiaNoEncontrada ||
        error instanceof BarberoNoEncontrado ||
        error instanceof AusenciaNoEncontrada
      )
        return void res.status(404).json({ error: error.message })
      if (error instanceof BarberoDesvinculado || error instanceof AusenciaAnulada)
        return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  return rutas
}
