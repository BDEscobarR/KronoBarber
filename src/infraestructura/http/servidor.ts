import express, { Router, type ErrorRequestHandler, type Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { openapi } from './openapi'
import { rutasBarberias, type DependenciasBarberias } from './rutas/barberias'
import { rutasServicios, type DependenciasServicios } from './rutas/servicios'
import { rutasBarberos, type DependenciasBarberos } from './rutas/barberos'

/**
 * Manejador de errores final. Express lo reconoce por sus cuatro parámetros y le pasa todo lo
 * que las rutas delegaron con `next(error)`.
 *
 * El 500 no filtra detalles internos al cliente: el error se escribe en la consola y la respuesta
 * es un mensaje genérico.
 */
const errores: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error?.type === 'entity.parse.failed') return void res.status(400).json({ error: 'El cuerpo no es JSON válido' })
  console.error(error)
  res.status(500).json({ error: 'Error interno' })
}

/**
 * Arma la aplicación Express con todo bajo el prefijo `/api`: verificación de vida, contrato
 * OpenAPI, Swagger UI y las rutas de barberías, servicios y barberos.
 *
 * Devuelve la app sin arrancarla: `listen()` vive en `main.ts`, así una prueba puede montarla sin
 * abrir un puerto. El orden importa: primero `express.json()`, luego las rutas,
 * después el 404 y al final el manejador de errores.
 *
 * @param deps Casos de uso y DAO que necesitan las rutas.
 * @returns La aplicación lista para `listen()`.
 */
export function crearServidor(
  deps: DependenciasBarberias & DependenciasServicios & DependenciasBarberos
): Express {
  const api = Router()
  api.get('/salud', (_req, res) => void res.json({ estado: 'ok' }))
  api.get('/openapi.json', (_req, res) => void res.json(openapi))
  api.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'KronoBarber API' }))

  api.use('/barberias', rutasBarberias(deps))
  api.use('/barberias', rutasServicios(deps))
  api.use('/barberos', rutasBarberos(deps))

  const app = express()
  app.use(express.json())
  app.use('/api', api)
  app.use((_req, res) => void res.status(404).json({ error: 'Ruta no encontrada' }))
  app.use(errores)
  return app
}