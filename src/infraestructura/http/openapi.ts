import { ESTADOS_BARBERIA } from '../../dominio/modelo/Barberia'
import {
  DURACION_MAXIMA_MINUTOS,
  DURACION_MINIMA_MINUTOS,
  PASO_DURACION_MINUTOS,
  PRECIO_MAXIMO,
} from '../../dominio/modelo/Servicio'

// Contrato OpenAPI como objeto TS: los enums y límites se importan del dominio,
// así la documentación no puede quedar desalineada con las reglas.

/** Esquema del cuerpo de toda respuesta de error: `{ error: string }`. */
const error = {
  type: 'object',
  properties: { error: { type: 'string', example: 'correo inválido' } },
  required: ['error'],
}

/** Esquema de `BarberiaDTO`. */
const barberia = {
  type: 'object',
  description:
    'Barbería tal como viaja por HTTP (`BarberiaDTO`): la entidad del dominio sin el motivo interno ' +
    'de una suspensión.',
  properties: {
    id: { type: 'string', format: 'uuid', example: '5b0f7c1e-2a4d-4e8b-9f3a-1c2d3e4f5a6b' },
    nombre: { type: 'string', example: 'Barbería El Clásico' },
    descripcion: { type: 'string', example: 'Cortes clásicos y arreglo de barba.' },
    direccion: { type: 'string', example: 'Calle 65 # 23-10' },
    ciudad: { type: 'string', example: 'Manizales' },
    telefono: { type: 'string', example: '6068871234' },
    correo: { type: 'string', format: 'email', example: 'contacto@elclasico.co' },
    estado: { type: 'string', enum: ESTADOS_BARBERIA, example: 'PENDIENTE_VERIFICACION' },
  },
  required: ['id', 'nombre', 'descripcion', 'direccion', 'ciudad', 'telefono', 'correo', 'estado'],
}

/** Esquema de `RegistroBarberiaDTO`; los límites coinciden con la validación de la ruta. */
const registroBarberia = {
  type: 'object',
  description: 'Datos del registro (`RegistroBarberiaDTO`). La barbería nace en PENDIENTE_VERIFICACION.',
  properties: {
    nombre: { type: 'string', minLength: 3, maxLength: 80, example: 'Barbería El Clásico' },
    descripcion: { type: 'string', maxLength: 500, example: 'Cortes clásicos y arreglo de barba.' },
    direccion: { type: 'string', minLength: 5, maxLength: 200, example: 'Calle 65 # 23-10' },
    ciudad: { type: 'string', minLength: 3, maxLength: 100, example: 'Manizales' },
    telefono: {
      type: 'string',
      description: 'Entre 7 y 15 dígitos, con prefijo + opcional. Se admiten espacios, guiones, puntos y paréntesis.',
      example: '(606) 887-1234',
    },
    correo: { type: 'string', format: 'email', maxLength: 254, example: 'contacto@elclasico.co' },
  },
  required: ['nombre', 'direccion', 'ciudad', 'telefono', 'correo'],
}

/** Esquema de `ServicioDTO`. */
const servicio = {
  type: 'object',
  description: 'Servicio del catálogo tal como viaja por HTTP (`ServicioDTO`).',
  properties: {
    id: { type: 'string', format: 'uuid', example: '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a' },
    barberiaId: { type: 'string', format: 'uuid', example: '5b0f7c1e-2a4d-4e8b-9f3a-1c2d3e4f5a6b' },
    nombre: { type: 'string', example: 'Corte clásico' },
    descripcion: { type: 'string', example: 'Tijera y máquina, con lavado.' },
    precio: { type: 'integer', description: 'Pesos colombianos enteros (COP).', example: 25000 },
    duracionMinutos: { type: 'integer', example: 30 },
    activo: { type: 'boolean', example: true },
  },
  required: ['id', 'barberiaId', 'nombre', 'descripcion', 'precio', 'duracionMinutos', 'activo'],
}

/** Esquema de `CreacionServicioDTO`; los límites se importan de las reglas del dominio. */
const creacionServicio = {
  type: 'object',
  description: 'Datos de un servicio nuevo (`CreacionServicioDTO`). Nace activo.',
  properties: {
    nombre: { type: 'string', minLength: 3, maxLength: 80, example: 'Corte clásico' },
    descripcion: { type: 'string', maxLength: 300, example: 'Tijera y máquina, con lavado.' },
    precio: {
      type: 'integer',
      minimum: 1,
      maximum: PRECIO_MAXIMO,
      description: 'Pesos colombianos enteros (COP). Sobre él se calcula el anticipo del 20 %.',
      example: 25000,
    },
    duracionMinutos: {
      type: 'integer',
      minimum: DURACION_MINIMA_MINUTOS,
      maximum: DURACION_MAXIMA_MINUTOS,
      multipleOf: PASO_DURACION_MINUTOS,
      example: 30,
    },
  },
  required: ['nombre', 'precio', 'duracionMinutos'],
}

/**
 * Contenido JSON que referencia un esquema de `components.schemas`.
 *
 * @param esquema Nombre del esquema, igual al del DTO.
 */
const json = (esquema: string) => ({ 'application/json': { schema: { $ref: `#/components/schemas/${esquema}` } } })

/**
 * Contenido JSON con una lista de elementos de un esquema.
 *
 * @param esquema Nombre del esquema de cada elemento.
 */
const lista = (esquema: string) => ({
  'application/json': { schema: { type: 'array', items: { $ref: `#/components/schemas/${esquema}` } } },
})

/**
 * Respuesta de error con el cuerpo `{ error }`.
 *
 * @param descripcion Cuándo se produce, tal como se muestra en Swagger.
 */
const fallo = (descripcion: string) => ({ description: descripcion, content: json('Error') })

/**
 * Parámetro de ruta obligatorio con un UUID.
 *
 * @param nombre Nombre del parámetro en la URL, sin los dos puntos.
 */
const parametroId = (nombre: string) => ({
  name: nombre,
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
})

/**
 * Contrato OpenAPI 3.0.3 de la API. Se sirve en `/api/openapi.json` y alimenta Swagger UI en
 * `/api/docs`. Los nombres de los esquemas son los mismos de los DTO del código, así lo que se
 * lee en la documentación se busca por el mismo identificador.
 */
export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'KronoBarber API',
    version: '0.1.0',
    description:
      'Plataforma multiempresa de gestión y reserva de turnos para barberías. ' +
      'Las guardas por rol (CAR-17) todavía no existen: hoy todos los endpoints son abiertos.',
  },
  servers: [{ url: '/api' }],
  tags: [{ name: 'Salud' }, { name: 'Barberías' }, { name: 'Servicios' }],
  paths: {
    '/salud': {
      get: {
        tags: ['Salud'],
        summary: 'Verificación de vida (no toca la base de datos)',
        responses: {
          200: {
            description: 'El servidor responde',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { estado: { type: 'string', example: 'ok' } } },
              },
            },
          },
        },
      },
    },
    '/barberias': {
      get: {
        tags: ['Barberías'],
        summary: 'Catálogo público: solo barberías habilitadas (CAR-07, RES-11)',
        parameters: [
          { name: 'ciudad', in: 'query', required: false, schema: { type: 'string' }, example: 'Manizales' },
        ],
        responses: { 200: { description: 'Barberías habilitadas, por nombre', content: lista('BarberiaDTO') } },
      },
      post: {
        tags: ['Barberías'],
        summary: 'Registra una barbería en PENDIENTE_VERIFICACION (CAR-01)',
        requestBody: { required: true, content: json('RegistroBarberiaDTO') },
        responses: {
          201: { description: 'Barbería registrada', content: json('BarberiaDTO') },
          400: fallo('Datos inválidos'),
          409: fallo('El correo ya está registrado'),
        },
      },
    },
    '/barberias/{id}': {
      get: {
        tags: ['Barberías'],
        summary: 'Detalle de una barbería, en cualquier estado',
        parameters: [parametroId('id')],
        responses: {
          200: { description: 'La barbería', content: json('BarberiaDTO') },
          404: fallo('No existe'),
        },
      },
    },
    '/barberias/{id}/habilitacion': {
      post: {
        tags: ['Barberías'],
        summary: 'El operador habilita la barbería (CAR-02)',
        parameters: [parametroId('id')],
        responses: {
          200: { description: 'Barbería habilitada', content: json('BarberiaDTO') },
          404: fallo('No existe'),
          409: fallo('Ya estaba habilitada'),
        },
      },
    },
    '/barberias/{barberiaId}/servicios': {
      get: {
        tags: ['Servicios'],
        summary: 'Catálogo público de una barbería: solo servicios activos, y solo si está habilitada',
        parameters: [parametroId('barberiaId')],
        responses: {
          200: { description: 'Servicios activos, por nombre', content: lista('ServicioDTO') },
          404: fallo('La barbería no existe o no está habilitada'),
        },
      },
      post: {
        tags: ['Servicios'],
        summary: 'Crea un servicio en el catálogo de la barbería (CAR-03)',
        parameters: [parametroId('barberiaId')],
        requestBody: { required: true, content: json('CreacionServicioDTO') },
        responses: {
          201: { description: 'Servicio creado', content: json('ServicioDTO') },
          400: fallo('Datos inválidos'),
          404: fallo('La barbería no existe'),
          409: fallo('La barbería ya tiene un servicio con ese nombre'),
        },
      },
    },
  },
  components: {
    schemas: {
      BarberiaDTO: barberia,
      RegistroBarberiaDTO: registroBarberia,
      ServicioDTO: servicio,
      CreacionServicioDTO: creacionServicio,
      Error: error,
    },
  },
}
