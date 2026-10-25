import { describe, expect, it } from 'vitest'
import {
  ConfigurarHorarioAtencion,
  HorarioInvalido,
  type FranjaSemanal,
} from '../../src/aplicacion/casos-uso/ConfigurarHorarioAtencion'
import { BarberiaNoEncontrada } from '../../src/aplicacion/casos-uso/HabilitarBarberia'
import { RegistrarBarberia, type RegistroBarberiaDTO } from '../../src/aplicacion/casos-uso/RegistrarBarberia'
import {
  esDiaSemana,
  esFechaValida,
  esHoraValida,
  seSolapan,
  type Franja,
} from '../../src/dominio/modelo/HorarioAtencion'
import { BarberiaDAOEnMemoria } from '../dobles/BarberiaDAOEnMemoria'
import { HorarioAtencionDAOEnMemoria } from '../dobles/HorarioAtencionDAOEnMemoria'

const MANANA: Franja = { inicio: '08:00', fin: '12:00' }
const TARDE: Franja = { inicio: '14:00', fin: '18:00' }

describe('seSolapan', () => {
  it('no solapan dos franjas contiguas: el fin de una es el inicio de la otra', () => {
    const franja: Franja = { inicio: '08:00', fin: '12:00' }
    const siguiente: Franja = { inicio: '12:00', fin: '16:00' }

    expect(seSolapan(franja, siguiente)).toBe(false)
    expect(seSolapan(siguiente, franja)).toBe(false)
  })

  it('no solapan dos franjas separadas, como la jornada partida', () => {
    expect(seSolapan(MANANA, TARDE)).toBe(false)
    expect(seSolapan(TARDE, MANANA)).toBe(false)
  })

  it('solapan dos franjas parcialmente superpuestas', () => {
    const franja: Franja = { inicio: '08:00', fin: '12:00' }
    const parcial: Franja = { inicio: '10:00', fin: '14:00' }

    expect(seSolapan(franja, parcial)).toBe(true)
    expect(seSolapan(parcial, franja)).toBe(true)
  })

  it('solapan cuando una franja está contenida en la otra', () => {
    const amplia: Franja = { inicio: '08:00', fin: '18:00' }
    const contenida: Franja = { inicio: '10:00', fin: '12:00' }

    expect(seSolapan(amplia, contenida)).toBe(true)
    expect(seSolapan(contenida, amplia)).toBe(true)
  })

  it('solapa una franja consigo misma', () => {
    expect(seSolapan(MANANA, { ...MANANA })).toBe(true)
  })
})

describe('esDiaSemana', () => {
  it('acepta los siete días y rechaza cualquier otro texto', () => {
    expect(esDiaSemana('LUNES')).toBe(true)
    expect(esDiaSemana('DOMINGO')).toBe(true)
    expect(esDiaSemana('lunes')).toBe(false)
    expect(esDiaSemana('FERIADO')).toBe(false)
    expect(esDiaSemana(null)).toBe(false)
  })
})

describe('esHoraValida', () => {
  it('acepta horas HH:MM dentro del día y rechaza el resto', () => {
    expect(esHoraValida('00:00')).toBe(true)
    expect(esHoraValida('23:59')).toBe(true)
    expect(esHoraValida('24:00')).toBe(false)
    expect(esHoraValida('9:00')).toBe(false)
    expect(esHoraValida('09:60')).toBe(false)
  })
})

describe('esFechaValida', () => {
  it('acepta fechas YYYY-MM-DD que existen en el calendario y rechaza el resto', () => {
    expect(esFechaValida('2026-12-25')).toBe(true)
    expect(esFechaValida('2028-02-29')).toBe(true)
    expect(esFechaValida('2000-02-29')).toBe(true)
    expect(esFechaValida('2026-02-29')).toBe(false)
    expect(esFechaValida('1900-02-29')).toBe(false)
    expect(esFechaValida('2026-02-30')).toBe(false)
    expect(esFechaValida('2026-13-01')).toBe(false)
    expect(esFechaValida('2026-12-00')).toBe(false)
    expect(esFechaValida('25/12/2026')).toBe(false)
    expect(esFechaValida(null)).toBe(false)
  })
})

describe('HorarioAtencionDAOEnMemoria', () => {
  function armar() {
    return new HorarioAtencionDAOEnMemoria()
  }

  it('guarda varias franjas del mismo día, para la jornada partida', async () => {
    const horarios = armar()
    await horarios.guardar({ barberiaId: '1', diaSemana: 'LUNES', fecha: null, franja: MANANA })
    await horarios.guardar({ barberiaId: '1', diaSemana: 'LUNES', fecha: null, franja: TARDE })

    const deLaBarberia = await horarios.deBarberia('1')

    expect(deLaBarberia).toHaveLength(2)
    expect(deLaBarberia.map((h) => h.franja)).toEqual([MANANA, TARDE])
  })

  it('guarda un cierre puntual sin franja ni día de la semana', async () => {
    const horarios = armar()
    await horarios.guardar({ barberiaId: '1', diaSemana: null, fecha: '2026-12-25', franja: null })

    const [cierre] = await horarios.deBarberia('1')

    expect(cierre).toMatchObject({ diaSemana: null, fecha: '2026-12-25', franja: null })
  })

  it('solo devuelve el horario de la barbería pedida', async () => {
    const horarios = armar()
    await horarios.guardar({ barberiaId: '1', diaSemana: 'LUNES', fecha: null, franja: MANANA })
    await horarios.guardar({ barberiaId: '2', diaSemana: 'LUNES', fecha: null, franja: MANANA })

    expect(await horarios.deBarberia('1')).toHaveLength(1)
    expect(await horarios.deBarberia('3')).toEqual([])
  })

  it('reemplazar borra el horario anterior de la barbería sin tocar el de las demás', async () => {
    const horarios = armar()
    await horarios.guardar({ barberiaId: '1', diaSemana: 'LUNES', fecha: null, franja: MANANA })
    await horarios.guardar({ barberiaId: '2', diaSemana: 'LUNES', fecha: null, franja: MANANA })

    await horarios.reemplazar('1', [{ barberiaId: '1', diaSemana: 'MARTES', fecha: null, franja: TARDE }])

    expect(await horarios.deBarberia('1')).toMatchObject([{ diaSemana: 'MARTES', franja: TARDE }])
    expect(await horarios.deBarberia('2')).toHaveLength(1)
  })
})

describe('ConfigurarHorarioAtencion', () => {
  const EL_CLASICO: RegistroBarberiaDTO = {
    nombre: 'Barbería El Clásico',
    descripcion: '',
    direccion: 'Calle 65 # 23-10',
    ciudad: 'Manizales',
    telefono: '6068871234',
    correo: 'horario@clasico.co',
  }

  async function armar() {
    const barberias = new BarberiaDAOEnMemoria()
    const horarios = new HorarioAtencionDAOEnMemoria()
    const { id: barberiaId } = await new RegistrarBarberia(barberias).ejecutar(EL_CLASICO)
    return { barberiaId, horarios, configurar: new ConfigurarHorarioAtencion(barberias, horarios) }
  }

  const lunes = (franja: Franja): FranjaSemanal => ({ diaSemana: 'LUNES', ...franja })

  it('rechaza franjas del mismo día que se solapan', async () => {
    const { barberiaId, configurar } = await armar()

    await expect(
      configurar.ejecutar({
        barberiaId,
        franjas: [lunes({ inicio: '09:00', fin: '12:00' }), lunes({ inicio: '11:00', fin: '13:00' })],
        cierres: [],
      }),
    ).rejects.toThrow('no pueden solaparse')
  })

  it('admite franjas contiguas del mismo día y la misma franja en días distintos', async () => {
    const { barberiaId, configurar } = await armar()
    const franjas: FranjaSemanal[] = [
      lunes({ inicio: '09:00', fin: '12:00' }),
      lunes({ inicio: '12:00', fin: '14:00' }),
      { diaSemana: 'MARTES', inicio: '09:00', fin: '12:00' },
    ]

    const horario = await configurar.ejecutar({ barberiaId, franjas, cierres: [] })

    expect(horario.franjas).toEqual(franjas)
  })

  it('rechaza una franja que empieza a la misma hora o después de terminar', async () => {
    const { barberiaId, configurar } = await armar()

    for (const [inicio, fin] of [['12:00', '12:00'], ['13:00', '12:00']] as const) {
      await expect(configurar.ejecutar({ barberiaId, franjas: [lunes({ inicio, fin })], cierres: [] })).rejects.toThrow(
        HorarioInvalido,
      )
    }
  })

  it('admite cierres por fecha específica y los guarda como cierres puntuales', async () => {
    const { barberiaId, configurar, horarios } = await armar()

    const horario = await configurar.ejecutar({
      barberiaId,
      franjas: [lunes(MANANA)],
      cierres: ['2026-12-25'],
    })

    expect(horario).toEqual({ barberiaId, franjas: [lunes(MANANA)], cierres: ['2026-12-25'] })
    expect(await horarios.deBarberia(barberiaId)).toEqual(
      expect.arrayContaining([expect.objectContaining({ diaSemana: null, fecha: '2026-12-25', franja: null })]),
    )
  })

  it('rechaza un cierre repetido', async () => {
    const { barberiaId, configurar } = await armar()

    await expect(
      configurar.ejecutar({ barberiaId, franjas: [], cierres: ['2026-12-25', '2026-12-25'] }),
    ).rejects.toThrow('fechas repetidas')
  })

  it('reemplaza el horario anterior: lo que no viene deja de existir', async () => {
    const { barberiaId, configurar, horarios } = await armar()
    await configurar.ejecutar({ barberiaId, franjas: [lunes(MANANA), lunes(TARDE)], cierres: ['2026-12-25'] })

    await configurar.ejecutar({ barberiaId, franjas: [lunes(TARDE)], cierres: [] })

    expect(await horarios.deBarberia(barberiaId)).toMatchObject([{ diaSemana: 'LUNES', franja: TARDE }])
  })

  it('falla si la barbería no existe', async () => {
    const { configurar } = await armar()

    await expect(configurar.ejecutar({ barberiaId: 'inexistente', franjas: [], cierres: [] })).rejects.toBeInstanceOf(
      BarberiaNoEncontrada,
    )
  })
})
