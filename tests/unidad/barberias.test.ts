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
import {
  ActualizarPerfilBarberia,
  type ActualizacionPerfilBarberiaDTO,
} from '../../src/aplicacion/casos-uso/ActualizarPerfilBarberia'
import {
  BarberiaNoHabilitada,
  BarberiaYaSuspendida,
  SuspenderBarberia,
} from '../../src/aplicacion/casos-uso/SuspenderBarberia'
import { aBarberiaDTO, esVisibleParaClientes } from '../../src/dominio/modelo/Barberia'
import { BarberiaDAOEnMemoria } from '../dobles/BarberiaDAOEnMemoria'
import { HorarioAtencionDAOEnMemoria } from '../dobles/HorarioAtencionDAOEnMemoria'
import { ServicioDAOEnMemoria } from '../dobles/ServicioDAOEnMemoria'

const EL_CLASICO: RegistroBarberiaDTO = {
  nombre: '  Barbería El Clásico ',
  descripcion: 'Cortes clásicos y arreglo de barba.',
  direccion: 'Calle 65 # 23-10',
  ciudad: 'Manizales',
  telefono: '(606) 887-1234',
  correo: ' Contacto@ElClasico.co ',
}

/** Perfil nuevo para El Clásico: cambian nombre, ubicación, contacto y descripción. */
const PERFIL_NUEVO: Omit<ActualizacionPerfilBarberiaDTO, 'id'> = {
  nombre: ' Barbería El Moderno ',
  descripcion: ' Fades y diseño de barba. ',
  direccion: 'Carrera 23 # 70-15',
  ciudad: 'Pereira',
  telefono: '+57 300 123 4567',
  correo: ' Hola@ElModerno.co ',
}

function armar() {
  const barberias = new BarberiaDAOEnMemoria()
  return {
    barberias,
    registrar: new RegistrarBarberia(barberias),
    habilitar: new HabilitarBarberia(barberias),
    actualizar: new ActualizarPerfilBarberia(barberias),
    suspender: new SuspenderBarberia(barberias),
  }
}

/** Motivo válido de suspensión: entre 10 y 500 caracteres (D-02). */
const MOTIVO = 'Incumple la política de precios'

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

describe('SuspenderBarberia', () => {
  it('suspende una barbería habilitada, la saca de la vista de los clientes y guarda el motivo (RES-11)', async () => {
    const { registrar, habilitar, suspender } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })
    await habilitar.ejecutar(creada.id)

    const suspendida = await suspender.ejecutar({ id: creada.id, motivo: `  ${MOTIVO}  ` })

    expect(suspendida).toMatchObject({ estado: 'SUSPENDIDA', motivoSuspension: MOTIVO })
    expect(esVisibleParaClientes(suspendida)).toBe(false)
  })

  it('no suspende una barbería pendiente de verificación (D-02)', async () => {
    const { registrar, suspender, barberias } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })

    await expect(suspender.ejecutar({ id: creada.id, motivo: MOTIVO })).rejects.toBeInstanceOf(BarberiaNoHabilitada)
    expect(await barberias.porId(creada.id)).toMatchObject({ estado: 'PENDIENTE_VERIFICACION', motivoSuspension: null })
  })

  it('no suspende dos veces la misma barbería', async () => {
    const { registrar, habilitar, suspender } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })
    await habilitar.ejecutar(creada.id)
    await suspender.ejecutar({ id: creada.id, motivo: MOTIVO })

    await expect(suspender.ejecutar({ id: creada.id, motivo: MOTIVO })).rejects.toBeInstanceOf(BarberiaYaSuspendida)
  })

  it('falla si la barbería no existe, con el mismo error que reconoce la ruta', async () => {
    const { suspender } = armar()

    await expect(suspender.ejecutar({ id: 'no-existe', motivo: MOTIVO })).rejects.toBeInstanceOf(BarberiaNoEncontrada)
  })

  it('no borra información histórica: el catálogo y el horario siguen', async () => {
    const { registrar, habilitar, suspender } = armar()
    const servicios = new ServicioDAOEnMemoria()
    const horarios = new HorarioAtencionDAOEnMemoria()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })
    await habilitar.ejecutar(creada.id)
    await servicios.guardar({
      barberiaId: creada.id, nombre: 'Corte clásico', descripcion: '', precio: 25000, duracionMinutos: 30, activo: true,
    })
    await horarios.guardar({ barberiaId: creada.id, diaSemana: 'LUNES', fecha: null, franja: { inicio: '08:00', fin: '12:00' } })

    await suspender.ejecutar({ id: creada.id, motivo: MOTIVO })

    expect(await servicios.deBarberia(creada.id)).toHaveLength(1)
    expect(await horarios.deBarberia(creada.id)).toHaveLength(1)
  })
})

describe('ActualizarPerfilBarberia', () => {
  it('actualiza nombre, ubicación, contacto y descripción, con los datos normalizados', async () => {
    const { registrar, actualizar } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })

    const actualizada = await actualizar.ejecutar({ ...PERFIL_NUEVO, id: creada.id })

    expect(actualizada).toEqual({
      id: creada.id,
      nombre: 'Barbería El Moderno',
      descripcion: 'Fades y diseño de barba.',
      direccion: 'Carrera 23 # 70-15',
      ciudad: 'Pereira',
      telefono: '+573001234567',
      correo: 'hola@elmoderno.co',
      estado: 'PENDIENTE_VERIFICACION',
      motivoSuspension: null,
    })
  })

  it('no cambia el estado: una barbería habilitada sigue visible para los clientes', async () => {
    const { registrar, habilitar, actualizar } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })
    await habilitar.ejecutar(creada.id)

    const actualizada = await actualizar.ejecutar({ ...PERFIL_NUEVO, id: creada.id })

    expect(esVisibleParaClientes(actualizada)).toBe(true)
  })

  it('admite conservar su propio correo aunque cambien las mayúsculas', async () => {
    const { registrar, actualizar } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })

    const actualizada = await actualizar.ejecutar({
      ...EL_CLASICO,
      id: creada.id,
      nombre: 'El Clásico de la 65',
      correo: 'CONTACTO@elclasico.co',
    })

    expect(actualizada).toMatchObject({ nombre: 'El Clásico de la 65', correo: 'contacto@elclasico.co' })
  })

  it('rechaza un correo que ya usa otra barbería', async () => {
    const { registrar, actualizar } = armar()
    await registrar.ejecutar({ ...EL_CLASICO })
    const otra = await registrar.ejecutar({ ...PERFIL_NUEVO })

    await expect(
      actualizar.ejecutar({ ...PERFIL_NUEVO, id: otra.id, correo: 'contacto@elclasico.co' }),
    ).rejects.toBeInstanceOf(CorreoDeBarberiaYaRegistrado)
  })

  it('edita una barbería suspendida, que sigue suspendida y sin verse (D-03, RES-11)', async () => {
    const { registrar, habilitar, suspender, actualizar, barberias } = armar()
    const creada = await registrar.ejecutar({ ...EL_CLASICO })
    await habilitar.ejecutar(creada.id)
    await suspender.ejecutar({ id: creada.id, motivo: MOTIVO })

    const actualizada = await actualizar.ejecutar({ ...PERFIL_NUEVO, id: creada.id })

    expect(actualizada).toMatchObject({ nombre: 'Barbería El Moderno', estado: 'SUSPENDIDA', motivoSuspension: MOTIVO })
    expect(esVisibleParaClientes(actualizada)).toBe(false)
    expect(await barberias.habilitadas(null)).toEqual([])
  })

  it('falla si la barbería no existe', async () => {
    const { actualizar } = armar()

    await expect(actualizar.ejecutar({ ...PERFIL_NUEVO, id: 'no-existe' })).rejects.toBeInstanceOf(BarberiaNoEncontrada)
  })
})

describe('BarberiaDAOEnMemoria.porEstado', () => {
  it('filtra por estado y ordena por nombre, sin importar la ciudad', async () => {
    const { registrar, habilitar, barberias } = armar()
    const clasico = await registrar.ejecutar({ ...EL_CLASICO, nombre: 'Zona Clásica' })
    const moderna = await registrar.ejecutar({ ...EL_CLASICO, nombre: 'Barbería Moderna', correo: 'otro@correo.co' })
    await habilitar.ejecutar(moderna.id)

    const pendientes = await barberias.porEstado('PENDIENTE_VERIFICACION')
    const habilitadas = await barberias.porEstado('HABILITADA')

    expect(pendientes.map((b) => b.id)).toEqual([clasico.id])
    expect(habilitadas.map((b) => b.id)).toEqual([moderna.id])
  })

  it('no devuelve nada si ninguna barbería está en ese estado', async () => {
    const { barberias } = armar()

    expect(await barberias.porEstado('SUSPENDIDA')).toEqual([])
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
