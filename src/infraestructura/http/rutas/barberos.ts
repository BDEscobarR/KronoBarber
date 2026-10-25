import { Router } from 'express'
import { aJornadaDTO } from '../../../dominio/modelo/Jornada'
import { esBarberoDe } from '../../../dominio/modelo/Usuario'
import type { JornadaDAO, UsuarioDAO } from '../../../dominio/puertos'
import { BarberiaNoEncontrada } from '../../../aplicacion/casos-uso/HabilitarBarberia'
import {
  BarberoDesvinculado,
  BarberoNoEncontrado,
  JornadaFueraDeHorario,
  JornadaInvalida,
  type DefinicionJornadaDTO,
  type DefinirJornada,
} from '../../../aplicacion/casos-uso/DefinirJornada'
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

/** Lo que necesitan las rutas del personal; `main.ts` lo arma con implementaciones concretas. */
export interface DependenciasBarberos {
  /** Caso de uso de la jornada del barbero (CAR-06, D-16). */
  definirJornada: DefinirJornada
  /** Acceso a las cuentas, para comprobar que el barbero es de la barbería de la URL (RES-02). */
  usuarios: UsuarioDAO
  /** Acceso directo a las jornadas para consultarlas. */
  jornadas: JornadaDAO
}

/**
 * Rutas del personal de una barbería, montadas en `/api/barberias`. Los barberos cuelgan de su
 * barbería en la URL, igual que los servicios:
 *
 * - `PUT /:barberiaId/barberos/:barberoId/jornada`: reemplaza la jornada del barbero. Responde 200,
 *   400, 404 o 409.
 * - `GET /:barberiaId/barberos/:barberoId/jornada`: la jornada registrada. Responde 200 o 404.
 *
 * @param deps Caso de uso y DAO que usan los handlers.
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

  return rutas
}
