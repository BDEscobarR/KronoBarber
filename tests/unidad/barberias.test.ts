import { describe, expect, it } from 'vitest'
import {
  CorreoDeBarberiaYaRegistrado,
  RegistrarBarberia,
  type RegistroBarberiaDTO,
} from '../../src/aplicacion/casos-uso/RegistrarBarberia'
import {
  BarberiaNoEncontrada,
  BarberiaYaHabilitada,
  HabilitarBarberia,
} from '../../src/aplicacion/casos-uso/HabilitarBarberia'
import { aBarberiaDTO, esVisibleParaClientes } from '../../src/dominio/modelo/Barberia'
import { BarberiaDAOEnMemoria } from '../dobles/BarberiaDAOEnMemoria'

const EL_CLASICO: RegistroBarberiaDTO = {
  nombre: '  Barbería El Clásico ',
  descripcion: 'Cortes clásicos y arreglo de barba.',
  direccion: 'Calle 65 # 23-10',
  ciudad: 'Manizales',
  telefono: '(606) 887-1234',
  correo: ' Contacto@ElClasico.co ',
}

function armar() {
  const barberias = new BarberiaDAOEnMemoria()
  return {
    barberias,
    registrar: new RegistrarBarberia(barberias),
    habilitar: new HabilitarBarberia(barberias),
  }
}

describe('RegistrarBarberia', () => {
  it('registra la barbería pendiente de verificación, con los datos normalizados', async () => {
    const { registrar } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })

    expect(creada).toMatchObject({
      nombre: 'Barbería El Clásico',
      telefono: '6068871234',
      correo: 'contacto@elclasico.co',
      estado: 'PENDIENTE_VERIFICACION',
      motivoSuspension: null,
    })
    expect(esVisibleParaClientes(creada)).toBe(false)
  })

  it('rechaza un correo ya registrado aunque cambien las mayúsculas', async () => {
    const { registrar } = armar()
    await registrar.ejecutar({ ...EL_CLASICO })

    await expect(registrar.ejecutar({ ...EL_CLASICO, correo: 'CONTACTO@elclasico.co' })).rejects.toBeInstanceOf(
      CorreoDeBarberiaYaRegistrado,
    )
  })
})

describe('HabilitarBarberia', () => {
  it('habilita una barbería pendiente y la vuelve visible para los clientes', async () => {
    const { registrar, habilitar } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })

    const habilitada = await habilitar.ejecutar(creada.id)

    expect(habilitada.estado).toBe('HABILITADA')
    expect(esVisibleParaClientes(habilitada)).toBe(true)
  })

  it('rehabilita una barbería suspendida y borra el motivo de la suspensión', async () => {
    const { registrar, habilitar, barberias } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })
    await barberias.cambiarEstado(creada.id, 'SUSPENDIDA', 'Incumple la política de precios')

    const habilitada = await habilitar.ejecutar(creada.id)

    expect(habilitada).toMatchObject({ estado: 'HABILITADA', motivoSuspension: null })
  })

  it('no habilita dos veces la misma barbería', async () => {
    const { registrar, habilitar } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })
    await habilitar.ejecutar(creada.id)

    await expect(habilitar.ejecutar(creada.id)).rejects.toBeInstanceOf(BarberiaYaHabilitada)
  })

  it('falla si la barbería no existe', async () => {
    const { habilitar } = armar()

    await expect(habilitar.ejecutar('no-existe')).rejects.toBeInstanceOf(BarberiaNoEncontrada)
  })
})

describe('aBarberiaDTO', () => {
  it('nunca deja salir el motivo de una suspensión', () => {
    const dto = aBarberiaDTO({
      id: '1',
      nombre: 'Barbería El Clásico',
      descripcion: '',
      direccion: 'Calle 65 # 23-10',
      ciudad: 'Manizales',
      telefono: '6068871234',
      correo: 'contacto@elclasico.co',
      estado: 'SUSPENDIDA',
      motivoSuspension: 'Incumple la política de precios',
    })

    expect(dto).not.toHaveProperty('motivoSuspension')
  })
})
