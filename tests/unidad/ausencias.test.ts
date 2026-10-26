import { describe, it, expect, beforeEach } from 'vitest'
import { RegistrarAusencia } from '../../src/aplicacion/casos-uso/RegistrarAusencia'
import { AusenciaDAOEnMemoria } from '../dobles/AusenciaDAOEnMemoria'
import type { UsuarioDAO } from '../../src/dominio/puertos'

describe('Caso de Uso: RegistrarAusencia', () => {
  let ausenciaDAO: AusenciaDAOEnMemoria
  let usuarioDAO: UsuarioDAO
  let registrarAusencia: RegistrarAusencia

  const adminValido = {
    id: 'admin-1',
    nombre: 'Admin Juan',
    correo: 'admin@barberia.com',
    claveHash: 'hash',
    rol: 'ADMINISTRADOR',
    barberiaId: 'barberia-1',
    activo: true,
    creadoEn: new Date(),
  }

  const barberoValido = {
    id: 'barbero-1',
    nombre: 'Barbero Carlos',
    correo: 'carlos@barberia.com',
    claveHash: 'hash',
    rol: 'BARBERO',
    barberiaId: 'barberia-1',
    activo: true,
    creadoEn: new Date(),
  }

  const barberoOtraBarberia = {
    id: 'barbero-otra-barberia',
    nombre: 'Barbero Pedro',
    correo: 'pedro@barberia.com',
    claveHash: 'hash',
    rol: 'BARBERO',
    barberiaId: 'barberia-2',
    activo: true,
    creadoEn: new Date(),
  }

  beforeEach(() => {
    ausenciaDAO = new AusenciaDAOEnMemoria()

    usuarioDAO = {
      porId: async (id: string) => {
        if (id === 'admin-1') return adminValido as any
        if (id === 'barbero-1') return barberoValido as any
        if (id === 'barbero-otra-barberia') return barberoOtraBarberia as any
        return null
      },
      porCorreo: async (correo: string) => null,
      guardar: async (u: any) => u,
      actualizar: async (u: any) => u,
    } as any

    registrarAusencia = new RegistrarAusencia(ausenciaDAO, usuarioDAO)
  })

  it('debe registrar una ausencia correctamente cuando los datos son válidos', async () => {
    const desde = new Date('2026-11-01T08:00:00Z')
    const hasta = new Date('2026-11-01T18:00:00Z')

    const resultado = await registrarAusencia.ejecutar({
      barberoId: 'barbero-1',
      adminId: 'admin-1',
      tipo: 'DIA_LIBRE',
      desde,
      hasta,
    })

    expect(resultado.id).toBeDefined()
    expect(resultado.tipo).toBe('DIA_LIBRE')
    expect(resultado.estado).toBe('ACTIVA')
    expect(ausenciaDAO.ausencias).toHaveLength(1)
  })

  it('debe lanzar error si la fecha de fin es igual o anterior a la fecha de inicio', async () => {
    const desde = new Date('2026-11-01T18:00:00Z')
    const hasta = new Date('2026-11-01T08:00:00Z')

    await expect(
      registrarAusencia.ejecutar({
        barberoId: 'barbero-1',
        adminId: 'admin-1',
        tipo: 'PERMISO',
        desde,
        hasta,
      })
    ).rejects.toThrow('La fecha de fin debe ser posterior a la fecha de inicio.')
  })

  it('debe lanzar error si el administrador pertenece a una barbería diferente', async () => {
    const desde = new Date('2026-11-01T08:00:00Z')
    const hasta = new Date('2026-11-01T18:00:00Z')

    await expect(
      registrarAusencia.ejecutar({
        barberoId: 'barbero-otra-barberia',
        adminId: 'admin-1',
        tipo: 'BLOQUEO',
        desde,
        hasta,
      })
    ).rejects.toThrow('El administrador solo puede gestionar ausencias de barberos de su propia barbería.')
  })
})