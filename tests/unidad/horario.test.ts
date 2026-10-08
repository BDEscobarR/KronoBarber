import { describe, expect, it } from 'vitest'
import { esDiaSemana, esHoraValida, seSolapan, type Franja } from '../../src/dominio/modelo/HorarioAtencion'
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
})
