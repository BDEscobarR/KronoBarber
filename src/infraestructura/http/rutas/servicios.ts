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

/**
 * Validación de frontera de un servicio nuevo: lo que entra por HTTP es `unknown` hasta que se
 * prueba lo contrario. Precio y duración se validan con las reglas del dominio.
 *
 * @param barberiaId Barbería tomada de la URL.
 * @param cuerpo Cuerpo de la petición, sin validar.
 * @returns Los datos listos para `CrearServicio`, o el mensaje de error para responder un 400.
 */
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

/** Lo que necesitan las rutas del catálogo; `main.ts` lo arma con implementaciones concretas. */
export interface DependenciasServicios {
  /** Caso de uso del alta de servicios (CAR-03). */
  crearServicio: CrearServicio
  /** Acceso a las barberías, para comprobar que la vitrina es visible (RES-11). */
  barberias: BarberiaDAO
  /** Acceso directo al catálogo para la consulta pública. */
  servicios: ServicioDAO
}

/**
 * Rutas del catálogo de servicios, montadas en `/api/barberias`. Los servicios cuelgan de una
 * barbería en la URL:
 *
 * - `POST /:barberiaId/servicios`: crea un servicio. Responde 201, 400, 404 o 409.
 * - `GET /:barberiaId/servicios`: vitrina con los servicios activos de una barbería habilitada.
 *   Responde 200 o 404.
 *
 * @param deps Caso de uso y DAO que usan los handlers.
 * @returns El router de Express.
 */
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
