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

/** Forma mínima de un correo: algo@algo.algo, sin espacios. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Teléfono ya normalizado: entre 7 y 15 dígitos, con `+` inicial opcional. */
const TELEFONO = /^\+?\d{7,15}$/

/**
 * ¿Es texto y, sin espacios en los extremos, mide entre `minimo` y `maximo` caracteres?
 *
 * @param valor Dato de origen desconocido.
 * @param minimo Longitud mínima admitida.
 * @param maximo Longitud máxima admitida; coincide con el tamaño de la columna.
 * @returns `true` si `valor` es un texto de longitud válida.
 */
function textoEntre(valor: unknown, minimo: number, maximo: number): valor is string {
  return typeof valor === 'string' && valor.trim().length >= minimo && valor.trim().length <= maximo
}

/**
 * Validación de frontera del registro: lo que entra por HTTP es `unknown` hasta que se prueba lo
 * contrario. Los límites coinciden con los tamaños de columna de `schema.prisma`.
 *
 * @param cuerpo Cuerpo de la petición, sin validar.
 * @returns Los datos listos para `RegistrarBarberia`, o el mensaje de error para responder un 400.
 */
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

/** Lo que necesitan las rutas de barberías; `main.ts` lo arma con implementaciones concretas. */
export interface DependenciasBarberias {
  /** Caso de uso del registro (CAR-01). */
  registrarBarberia: RegistrarBarberia
  /** Caso de uso de la habilitación (CAR-02). */
  habilitarBarberia: HabilitarBarberia
  /** Acceso directo para las consultas que no tienen reglas propias. */
  barberias: BarberiaDAO
}

/**
 * Rutas de barberías, montadas en `/api/barberias`:
 *
 * - `POST /`: registra una barbería. Responde 201, 400 o 409.
 * - `GET /?ciudad=`: catálogo público, solo habilitadas. Responde 200.
 * - `GET /:id`: detalle en cualquier estado. Responde 200 o 404.
 * - `POST /:id/habilitacion`: el operador la habilita. Responde 200, 404 o 409.
 *
 * Cada handler valida, llama al caso de uso, responde con el DTO y traduce los errores de negocio
 * a códigos HTTP; el resto lo delega a `next(error)`.
 *
 * @param deps Casos de uso y DAO que usan los handlers.
 * @returns El router de Express.
 */
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
