import { Router } from 'express'
import { esVisibleParaClientes } from '../../../dominio/modelo/Barberia'
import {
  DURACION_MAXIMA_MINUTOS,
  DURACION_MINIMA_MINUTOS,
  PASO_DURACION_MINUTOS,
  PRECIO_MAXIMO,
  aServicioDTO,
  esDuracionValida,
  esPrecioValido,
} from '../../../dominio/modelo/Servicio'
import type { BarberiaDAO, ServicioDAO } from '../../../dominio/puertos'
import {
  ServicioYaExiste,
  type CrearServicio,
  type CreacionServicioDTO,
} from '../../../aplicacion/casos-uso/CrearServicio'
import { BarberiaNoEncontrada } from '../../../aplicacion/casos-uso/HabilitarBarberia'

/** Validación de frontera: lo que entra por HTTP es `unknown` hasta que se prueba lo contrario. */
function validarServicio(barberiaId: string, cuerpo: unknown): CreacionServicioDTO | string {
  const d = (cuerpo ?? {}) as Record<string, unknown>
  const descripcion: unknown = d['descripcion'] ?? ''
  if (typeof d['nombre'] !== 'string' || d['nombre'].trim().length < 3 || d['nombre'].trim().length > 80)
    return 'nombre requerido (entre 3 y 80 caracteres)'
  if (typeof descripcion !== 'string' || descripcion.trim().length > 300)
    return 'descripcion inválida (máximo 300 caracteres)'
  if (!esPrecioValido(d['precio'])) return `precio inválido (pesos enteros entre 1 y ${PRECIO_MAXIMO})`
  if (!esDuracionValida(d['duracionMinutos']))
    return (
      `duracionMinutos inválida (entre ${DURACION_MINIMA_MINUTOS} y ${DURACION_MAXIMA_MINUTOS}, ` +
      `múltiplo de ${PASO_DURACION_MINUTOS})`
    )
  return {
    barberiaId,
    nombre: d['nombre'],
    descripcion,
    precio: d['precio'],
    duracionMinutos: d['duracionMinutos'],
  }
}

export interface DependenciasServicios {
  crearServicio: CrearServicio
  barberias: BarberiaDAO
  servicios: ServicioDAO
}

export function rutasServicios(deps: DependenciasServicios): Router {
  const rutas = Router()

  rutas.post('/:barberiaId/servicios', async (req, res, next) => {
    const datos = validarServicio(req.params.barberiaId, req.body)
    if (typeof datos === 'string') return void res.status(400).json({ error: datos })
    try {
      res.status(201).json(aServicioDTO(await deps.crearServicio.ejecutar(datos)))
    } catch (error) {
      if (error instanceof BarberiaNoEncontrada) return void res.status(404).json({ error: error.message })
      if (error instanceof ServicioYaExiste) return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  // Vitrina del cliente (CAR-07): el catálogo de una barbería no habilitada no existe
  // para nadie de afuera (RES-11), así que se responde igual que si no existiera.
  rutas.get('/:barberiaId/servicios', async (req, res, next) => {
    try {
      const barberia = await deps.barberias.porId(req.params.barberiaId)
      if (!barberia || !esVisibleParaClientes(barberia))
        return void res.status(404).json({ error: 'Barbería no encontrada' })
      res.json((await deps.servicios.activosDe(barberia.id)).map(aServicioDTO))
    } catch (error) {
      next(error)
    }
  })

  return rutas
}
