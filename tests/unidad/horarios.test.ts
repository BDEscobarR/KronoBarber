import { describe, expect, it } from 'vitest'
import { ConfigurarHorarioAtencion, validarConfiguracionHorario } from '../../src/aplicacion/casos-uso/ConfigurarHorarioAtencion'
import { BarberiaNoEncontrada } from '../../src/aplicacion/casos-uso/HabilitarBarberia'
import { RegistrarBarberia, type RegistroBarberiaDTO } from '../../src/aplicacion/casos-uso/RegistrarBarberia'
import { BarberiaDAOEnMemoria } from '../dobles/BarberiaDAOEnMemoria'
import { HorarioAtencionDAOEnMemoria } from '../dobles/HorarioAtencionDAOEnMemoria'

const barberia: RegistroBarberiaDTO = {
  nombre: 'Barbería El Clásico', descripcion: '', direccion: 'Calle 65 # 23-10',
  ciudad: 'Manizales', telefono: '6068871234', correo: 'horario@clasico.co',
}

describe('validarConfiguracionHorario', () => {
  it('rechaza franjas solapadas del mismo día', () => {
    expect(validarConfiguracionHorario({
      franjas: [
        { diaSemana: 1, horaInicio: '09:00', horaFin: '12:00' },
        { diaSemana: 1, horaInicio: '11:00', horaFin: '13:00' },
      ], cierres: [],
    })).toContain('no pueden solaparse')
  })

  it('permite franjas adyacentes y franjas de días distintos', () => {
    expect(validarConfiguracionHorario({
      franjas: [
        { diaSemana: 1, horaInicio: '09:00', horaFin: '12:00' },
        { diaSemana: 1, horaInicio: '12:00', horaFin: '14:00' },
        { diaSemana: 2, horaInicio: '09:00', horaFin: '17:00' },
      ], cierres: [],
    })).toMatchObject({ franjas: [{ diaSemana: 1 }, { diaSemana: 1 }, { diaSemana: 2 }] })
  })

  it('rechaza inicio igual o posterior al fin', () => {
    for (const [horaInicio, horaFin] of [['12:00', '12:00'], ['13:00', '12:00']]) {
      expect(validarConfiguracionHorario({
        franjas: [{ diaSemana: 1, horaInicio, horaFin }], cierres: [],
      })).toContain('horaInicio debe ser anterior')
    }
  })

  it('acepta cierres por fecha específica y rechaza fechas inexistentes', () => {
    expect(validarConfiguracionHorario({ franjas: [], cierres: ['2026-12-25'] })).toEqual({ franjas: [], cierres: ['2026-12-25'] })
    expect(validarConfiguracionHorario({ franjas: [], cierres: ['2026-02-30'] })).toContain('fechas válidas')
  })
})

describe('ConfigurarHorarioAtencion', () => {
  it('persiste el horario y los cierres de una barbería existente', async () => {
    const barberias = new BarberiaDAOEnMemoria()
    const horarios = new HorarioAtencionDAOEnMemoria()
    const creada = await new RegistrarBarberia(barberias).ejecutar(barberia)
    const configurar = new ConfigurarHorarioAtencion(barberias, horarios)

    await expect(configurar.ejecutar(creada.id, {
      franjas: [{ diaSemana: 1, horaInicio: '09:00', horaFin: '17:00' }], cierres: ['2026-12-25'],
    })).resolves.toMatchObject({ barberiaId: creada.id, cierres: ['2026-12-25'] })
  })

  it('falla si la barbería no existe', async () => {
    const configurar = new ConfigurarHorarioAtencion(new BarberiaDAOEnMemoria(), new HorarioAtencionDAOEnMemoria())
    await expect(configurar.ejecutar('inexistente', { franjas: [], cierres: [] })).rejects.toBeInstanceOf(BarberiaNoEncontrada)
  })
})
