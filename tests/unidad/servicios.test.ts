import { describe, expect, it } from 'vitest'
import { CrearServicio, ServicioYaExiste, type CreacionServicioDTO } from '../../src/aplicacion/casos-uso/CrearServicio'
import { ActualizarServicio, ServicioNoEncontrado } from '../../src/aplicacion/casos-uso/ActualizarServicio'
import { BarberiaNoEncontrada } from '../../src/aplicacion/casos-uso/HabilitarBarberia'
import { RegistrarBarberia, type RegistroBarberiaDTO } from '../../src/aplicacion/casos-uso/RegistrarBarberia'
import { PRECIO_MAXIMO, esDuracionValida, esPrecioValido } from '../../src/dominio/modelo/Servicio'
import { BarberiaDAOEnMemoria } from '../dobles/BarberiaDAOEnMemoria'
import { ServicioDAOEnMemoria } from '../dobles/ServicioDAOEnMemoria'

const barberia = (correo: string): RegistroBarberiaDTO => ({
  nombre: 'Barbería El Clásico',
  descripcion: '',
  direccion: 'Calle 65 # 23-10',
  ciudad: 'Manizales',
  telefono: '6068871234',
  correo,
})

const CORTE: Omit<CreacionServicioDTO, 'barberiaId'> = {
  nombre: ' Corte clásico ',
  descripcion: 'Tijera y máquina, con lavado.',
  precio: 25000,
  duracionMinutos: 30,
}

function armar() {
  const barberias = new BarberiaDAOEnMemoria()
  const servicios = new ServicioDAOEnMemoria()
  return {
    servicios,
    registrar: new RegistrarBarberia(barberias),
    crear: new CrearServicio(barberias, servicios),
    actualizar: new ActualizarServicio(servicios),
  }
}

describe('CrearServicio', () => {
  it('crea el servicio activo aunque la barbería todavía no esté habilitada', async () => {
    const { registrar, crear, servicios } = armar()
    const { id: barberiaId } = await registrar.ejecutar(barberia('a@clasico.co'))

    const creado = await crear.ejecutar({ ...CORTE, barberiaId })

    expect(creado).toMatchObject({ barberiaId, nombre: 'Corte clásico', precio: 25000, activo: true })
    expect(await servicios.activosDe(barberiaId)).toHaveLength(1)
  })

  it('falla si la barbería no existe', async () => {
    const { crear } = armar()

    await expect(crear.ejecutar({ ...CORTE, barberiaId: 'no-existe' })).rejects.toBeInstanceOf(BarberiaNoEncontrada)
  })

  it('rechaza un nombre repetido en la misma barbería, sin distinguir mayúsculas', async () => {
    const { registrar, crear } = armar()
    const { id: barberiaId } = await registrar.ejecutar(barberia('a@clasico.co'))
    await crear.ejecutar({ ...CORTE, barberiaId })

    await expect(crear.ejecutar({ ...CORTE, barberiaId, nombre: 'CORTE CLÁSICO' })).rejects.toBeInstanceOf(
      ServicioYaExiste,
    )
  })

  it('permite el mismo nombre en otra barbería', async () => {
    const { registrar, crear } = armar()
    const primera = await registrar.ejecutar(barberia('a@clasico.co'))
    const segunda = await registrar.ejecutar(barberia('b@clasico.co'))
    await crear.ejecutar({ ...CORTE, barberiaId: primera.id })

    await expect(crear.ejecutar({ ...CORTE, barberiaId: segunda.id })).resolves.toMatchObject({ barberiaId: segunda.id })
  })
})

describe('ActualizarServicio', () => {
  it('actualiza nombre, precio y duración incluso si está inactivo, conservando el resto', async () => {
    const { registrar, crear, actualizar } = armar()
    const { id: barberiaId } = await registrar.ejecutar(barberia('editar@clasico.co'))
    const creado = await crear.ejecutar({ ...CORTE, barberiaId })
    creado.activo = false

    const actualizado = await actualizar.ejecutar(barberiaId, creado.id, {
      nombre: '  Corte premium ', precio: 35000, duracionMinutos: 45,
    })

    expect(actualizado).toMatchObject({
      id: creado.id, barberiaId, nombre: 'Corte premium', descripcion: CORTE.descripcion,
      precio: 35000, duracionMinutos: 45, activo: false,
    })
  })

  it('no actualiza un servicio que pertenece a otra barbería', async () => {
    const { registrar, crear, actualizar } = armar()
    const primera = await registrar.ejecutar(barberia('primera@clasico.co'))
    const segunda = await registrar.ejecutar(barberia('segunda@clasico.co'))
    const creado = await crear.ejecutar({ ...CORTE, barberiaId: primera.id })

    await expect(actualizar.ejecutar(segunda.id, creado.id, {
      nombre: 'Corte premium', precio: 35000, duracionMinutos: 45,
    })).rejects.toBeInstanceOf(ServicioNoEncontrado)
    expect(creado.nombre).toBe('Corte clásico')
  })

  it('rechaza un nombre ya usado por otro servicio de la barbería', async () => {
    const { registrar, crear, actualizar } = armar()
    const { id: barberiaId } = await registrar.ejecutar(barberia('duplicado@clasico.co'))
    const primero = await crear.ejecutar({ ...CORTE, barberiaId })
    const segundo = await crear.ejecutar({ ...CORTE, barberiaId, nombre: 'Barba clásica' })

    await expect(actualizar.ejecutar(barberiaId, segundo.id, {
      nombre: primero.nombre, precio: 30000, duracionMinutos: 30,
    })).rejects.toBeInstanceOf(ServicioYaExiste)
  })
})

describe('reglas de precio y duración', () => {
  it('el precio son pesos enteros mayores que cero y hasta el tope', () => {
    expect(esPrecioValido(25000)).toBe(true)
    expect(esPrecioValido(PRECIO_MAXIMO)).toBe(true)
    expect(esPrecioValido(0)).toBe(false)
    expect(esPrecioValido(25000.5)).toBe(false)
    expect(esPrecioValido('25000')).toBe(false)
    expect(esPrecioValido(PRECIO_MAXIMO + 1)).toBe(false)
  })

  it('la duración encaja en la rejilla de 5 minutos, entre 5 y 480', () => {
    expect(esDuracionValida(5)).toBe(true)
    expect(esDuracionValida(480)).toBe(true)
    expect(esDuracionValida(0)).toBe(false)
    expect(esDuracionValida(33)).toBe(false)
    expect(esDuracionValida(485)).toBe(false)
    expect(esDuracionValida('30')).toBe(false)
  })
})
