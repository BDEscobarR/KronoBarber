import { Router } from 'express'
import { aBarberiaDTO, normalizarTelefono } from '../../../dominio/modelo/Barberia'
import type { BarberiaDAO } from '../../../dominio/puertos'
import {
  BarberiaNoEncontrada,
  BarberiaYaHabilitada,
  type HabilitarBarberia,
} from '../../../aplicacion/casos-uso/HabilitarBarberia'
import {
  CorreoDeBarberiaYaRegistrado,
  type RegistrarBarberia,
  type RegistroBarberiaDTO,
} from '../../../aplicacion/casos-uso/RegistrarBarberia'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO = /^\+?\d{7,15}$/

/** ¿Es texto y, sin espacios en los extremos, mide entre `minimo` y `maximo`? */
function textoEntre(valor: unknown, minimo: number, maximo: number): valor is string {
  return typeof valor === 'string' && valor.trim().length >= minimo && valor.trim().length <= maximo
}

/** Validación de frontera: lo que entra por HTTP es `unknown` hasta que se prueba lo contrario. */
function validarRegistro(cuerpo: unknown): RegistroBarberiaDTO | string {
  const d = (cuerpo ?? {}) as Record<string, unknown>
  const descripcion: unknown = d['descripcion'] ?? ''
  if (!textoEntre(d['nombre'], 3, 80)) return 'nombre requerido (entre 3 y 80 caracteres)'
  if (!textoEntre(descripcion, 0, 500)) return 'descripcion inválida (máximo 500 caracteres)'
  if (!textoEntre(d['direccion'], 5, 200)) return 'direccion requerida (entre 5 y 200 caracteres)'
  if (!textoEntre(d['ciudad'], 3, 100)) return 'ciudad requerida (entre 3 y 100 caracteres)'
  if (typeof d['telefono'] !== 'string' || !TELEFONO.test(normalizarTelefono(d['telefono'])))
    return 'telefono inválido (entre 7 y 15 dígitos, prefijo + opcional)'
  if (!textoEntre(d['correo'], 3, 254) || !CORREO.test(d['correo'].trim())) return 'correo inválido'
  return {
    nombre: d['nombre'],
    descripcion,
    direccion: d['direccion'],
    ciudad: d['ciudad'],
    telefono: d['telefono'],
    correo: d['correo'],
  }
}

export interface DependenciasBarberias {
  registrarBarberia: RegistrarBarberia
  habilitarBarberia: HabilitarBarberia
  barberias: BarberiaDAO
}

export function rutasBarberias(deps: DependenciasBarberias): Router {
  const rutas = Router()

  rutas.post('/', async (req, res, next) => {
    const datos = validarRegistro(req.body)
    if (typeof datos === 'string') return void res.status(400).json({ error: datos })
    try {
      res.status(201).json(aBarberiaDTO(await deps.registrarBarberia.ejecutar(datos)))
    } catch (error) {
      if (error instanceof CorreoDeBarberiaYaRegistrado) return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  // Catálogo público (CAR-07): una barbería no habilitada no es visible (RES-11).
  rutas.get('/', async (req, res, next) => {
    try {
      const ciudad = req.query['ciudad']
      const filtro = typeof ciudad === 'string' && ciudad.trim() ? ciudad.trim() : null
      res.json((await deps.barberias.habilitadas(filtro)).map(aBarberiaDTO))
    } catch (error) {
      next(error)
    }
  })

  rutas.get('/:id', async (req, res, next) => {
    try {
      const barberia = await deps.barberias.porId(req.params.id)
      if (!barberia) return void res.status(404).json({ error: 'Barbería no encontrada' })
      res.json(aBarberiaDTO(barberia))
    } catch (error) {
      next(error)
    }
  })

  // Acción del operador con efecto propio, no una edición del perfil: POST a un sub-recurso.
  rutas.post('/:id/habilitacion', async (req, res, next) => {
    try {
      res.json(aBarberiaDTO(await deps.habilitarBarberia.ejecutar(req.params.id)))
    } catch (error) {
      if (error instanceof BarberiaNoEncontrada) return void res.status(404).json({ error: error.message })
      if (error instanceof BarberiaYaHabilitada) return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  return rutas
}
