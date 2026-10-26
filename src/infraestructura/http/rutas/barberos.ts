import { Router, type Request, type Response } from 'express'
import type { RegistrarAusencia } from '../../../aplicacion/casos-uso/RegistrarAusencia'
import type { TipoAusencia } from '../../../dominio/puertos'

export interface DependenciasBarberos {
  registrarAusencia: RegistrarAusencia
}

export function rutasBarberos(deps: DependenciasBarberos): Router {
  const router = Router()

  // POST /barberos/:barberoId/ausencias (D-16, CAR-06)
  router.post('/:barberoId/ausencias', async (req: Request, res: Response) => {
    try {
      const barberoId = String(req.params['barberoId'])
      const body = req.body as Record<string, any>

      const ausencia = await deps.registrarAusencia.ejecutar({
        barberoId,
        adminId: String(body['adminId']),
        tipo: body['tipo'] as TipoAusencia,
        desde: new Date(body['desde']),
        hasta: new Date(body['hasta']),
      })

      return res.status(201).json(ausencia)
    } catch (error: any) {
      return res.status(400).json({ error: error.message })
    }
  })

  return router
}